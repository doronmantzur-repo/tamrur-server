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

// Retrieves the most relevant chunks for a question and asks Claude to
// answer using only that context.
async function askQuestion(question, k = 8) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable");
  }

  const embeddedChunks = await embeddedChunksPromise;
  const queryEmbedding = await embedQuery(question);
  const topChunks = retrieveTopK(embeddedChunks, queryEmbedding, k);
  const context = topChunks.map((chunk, i) => `[${i + 1}] ${chunk.text}`).join("\n\n");

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    system:
      "You are a medical reference assistant. The excerpts are in Hebrew. Answer the question using only the provided excerpts from the book, and answer in the same language as the question. If the excerpts don't contain the answer, say you don't know.",
    messages: [
      {
        role: "user",
        content: `Excerpts:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  return response.content.find((block) => block.type === "text").text;
}

module.exports = { askQuestion };
