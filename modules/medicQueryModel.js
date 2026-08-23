const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");

const EMBEDDING_MODEL = "Xenova/multilingual-e5-base";
const EMBEDDINGS_FILE = path.join(__dirname, "..", "data", "embeddings.json");

let embedder; // pipeline, loaded once and reused across calls

// E5 models are trained on asymmetric query/passage pairs, so the corpus
// chunks (embedded offline into embeddings.json) and search questions need
// different prefixes to land in the same space.
async function embedQuery(question) {
  const { pipeline } = await import("@xenova/transformers");
  if (!embedder) {
    embedder = await pipeline("feature-extraction", EMBEDDING_MODEL);
  }

  const output = await embedder(`query: ${question}`, {
    pooling: "mean",
    normalize: true,
  });
  return Array.from(output.data);
}

// Loaded once at startup; kept in memory for the process lifetime.
const embeddedChunksPromise = (async () => {
  const raw = fs.readFileSync(EMBEDDINGS_FILE, "utf8");
  return JSON.parse(raw);
})();

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function retrieveTopK(embeddedChunks, queryEmbedding, k = 8) {
  return embeddedChunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(chunk.embedding, queryEmbedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

const ANSWER_MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT =
  "You are a medical reference assistant. The excerpts are in Hebrew. Answer the question using only the provided excerpts from the book, and answer in the same language as the question. If the excerpts don't contain the answer, say you don't know. Earlier turns of this conversation may be included before the current question — use them for context (e.g. a follow-up question referring back to a previous answer), but still ground the answer itself only in the excerpts provided for the current question.";

// A session can send arbitrary history in the request body, so it's capped
// (bounds prompt size and cost) and shape-checked (only plain strings from
// prior turns of the same conversation should ever reach the prompt).
const MAX_HISTORY_TURNS = 6;

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter((turn) => turn && typeof turn.question === "string" && typeof turn.answer === "string")
    .slice(-MAX_HISTORY_TURNS);
}

const QUERY_REWRITE_SYSTEM_PROMPT =
  "Given a conversation history and a follow-up question, rewrite the follow-up as a single standalone search query that captures its full topic, resolving any references back to the earlier turns (e.g. \"and what about children?\" after a question about triage steps becomes a query about triage steps in children). Write it in the same language as the follow-up question. Reply with only the rewritten query, nothing else — no preamble, no quotes.";

// A follow-up question ("and what about children?") means little to the
// embedding model on its own — it needs the topic from earlier turns folded
// in before retrieval can find the right excerpts. Asks Claude to resolve it
// into a standalone query; the original question is untouched and still used
// for the answer itself, only retrieval searches with the resolved version.
async function resolveSearchQuery(anthropic, question, priorTurns) {
  if (priorTurns.length === 0) return question;

  const historyText = priorTurns
    .map((turn, i) => `Q${i + 1}: ${turn.question}\nA${i + 1}: ${turn.answer}`)
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: ANSWER_MODEL,
    max_tokens: 200,
    thinking: { type: "disabled" },
    system: QUERY_REWRITE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Conversation so far:\n${historyText}\n\nFollow-up question: ${question}\n\nStandalone search query:`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text.trim() : question;
}

// Retrieves the most relevant chunks for a question and asks Claude to answer
// using only that context, calling `emit(eventName, data)` after each real
// pipeline step so a UI can show progress live instead of only at the end.
// `emit("token", { text })` fires per streamed answer chunk from Claude, the
// same way its own chat UI streams a reply. `history` is the conversation's
// prior question/answer turns, so a follow-up question ("and what about
// children?") is answered with the earlier turns as context.
async function askQuestionStream(question, emit, { history = [], k = 8 } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable");
  }

  const priorTurns = sanitizeHistory(history);
  const anthropic = new Anthropic({ apiKey });

  emit("step", { key: "question", question });

  const searchQuery = await resolveSearchQuery(anthropic, question, priorTurns);
  if (searchQuery !== question) {
    emit("step", { key: "contextualize", searchQuery });
  }

  const queryEmbedding = await embedQuery(searchQuery);
  emit("step", {
    key: "embed",
    embeddingModel: EMBEDDING_MODEL,
    embeddingDimensions: queryEmbedding.length,
  });

  const embeddedChunks = await embeddedChunksPromise;
  emit("step", { key: "corpus", corpusSize: embeddedChunks.length });

  emit("step", { key: "similarity" });
  const topChunks = retrieveTopK(embeddedChunks, queryEmbedding, k);
  emit("step", {
    key: "retrieval",
    retrievedChunks: topChunks.map((chunk, i) => ({
      rank: i + 1,
      score: chunk.score,
      preview: chunk.text.trim().slice(0, 220),
    })),
  });

  const context = topChunks.map((chunk, i) => `[${i + 1}] ${chunk.text}`).join("\n\n");

  emit("step", { key: "generate", answerModel: ANSWER_MODEL });

  const stream = anthropic.messages.stream({
    model: ANSWER_MODEL,
    max_tokens: 2048,
    // This is a closed-context lookup over retrieved excerpts, not a
    // reasoning task — extended thinking isn't needed, and left enabled it
    // sometimes spent the entire max_tokens budget on thinking tokens before
    // emitting any answer text, leaving `content` with no text block at all.
    thinking: { type: "disabled" },
    system: SYSTEM_PROMPT,
    messages: [
      ...priorTurns.flatMap((turn) => [
        { role: "user", content: turn.question },
        { role: "assistant", content: turn.answer },
      ]),
      {
        role: "user",
        content: `Excerpts:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  stream.on("text", (textDelta) => emit("token", { text: textDelta }));

  const finalMessage = await stream.finalMessage();
  const textBlock = finalMessage.content.find((block) => block.type === "text");
  if (!textBlock) {
    throw new Error(
      finalMessage.stop_reason === "max_tokens"
        ? "התשובה נקטעה לפני שהתקבל תוכן, נסה שאלה קצרה יותר"
        : "לא התקבלה תשובה מהמודל",
    );
  }
  const answer = textBlock.text;

  emit("step", { key: "done" });
  emit("done", { answer });

  return answer;
}

// Exported so other features (e.g. evacPriorityModel) can retrieve context
// from the same trauma-book embeddings without loading a second copy of the
// ONNX embedding model into memory.
module.exports = { askQuestionStream, embedQuery, retrieveTopK, embeddedChunksPromise };
