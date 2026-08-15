const Anthropic = require("@anthropic-ai/sdk");
const casualtiesModel = require("./casualtiesModel.js");
const casualtiesTreatmentModel = require("./casualtiesTreatmentModel.js");
const medicQueryModel = require("./medicQueryModel.js");

const PRIORITY_TOOL = {
  name: "assign_evac_priorities",
  description: "Assigns an evacuation priority ranking to every casualty of the event.",
  input_schema: {
    type: "object",
    properties: {
      priorities: {
        type: "array",
        items: {
          type: "object",
          properties: {
            casualtyId: { type: "string" },
            priority: { type: "integer", minimum: 1 },
          },
          required: ["casualtyId", "priority"],
        },
      },
    },
    required: ["priorities"],
  },
};

const SYSTEM_PROMPT =
  "You are a combat medic triage assistant. You are given: (1) reference excerpts, in Hebrew, from " +
  "the unit's official trauma/combat-casualty-care manual describing triage and evacuation-priority " +
  "principles, and (2) a JSON list of an event's casualties and the treatments logged for " +
  "each. Base your evacuation-priority ranking primarily on the triage principles in the reference " +
  "excerpts, applied to each casualty's urgency, evac-ability, evac-ready status, and treatment " +
  "history — weigh both the casualty's own `treatments` field (a checklist of {done, text} items " +
  "recorded directly on the casualty) and `treatmentLog` (a separate chronological log of free-text " +
  "treatment records with timestamps). If the excerpts don't cover a specific situation, fall back on " +
  "standard triage judgment. Assign each casualty an evacuation priority: an integer starting at 1, " +
  "where 1 evacuates first (most urgent) and higher numbers evacuate later. Every casualty must " +
  "receive a distinct priority (no ties) covering 1..N for N casualties. Call the " +
  "assign_evac_priorities tool with your ranking; do not respond with plain text.";

const TRIAGE_EXCERPT_COUNT = 8;

/**
 * A fixed Hebrew query for the manual's triage/evacuation-priority guidance,
 * broadened with whatever urgency levels are actually present in this
 * event's casualties so retrieval leans toward the most relevant sections.
 */
function buildTriageQuery(casualties) {
  const urgencies = [...new Set(casualties.map((casualty) => casualty.urgency).filter(Boolean))];
  const base = "עקרונות מיון פצועים וקביעת סדר עדיפויות לפינוי לפי חומרה ודחיפות";
  return urgencies.length > 0 ? `${base} (${urgencies.join(", ")})` : base;
}

/**
 * On larger inputs Claude sometimes returns its own tool input double-wrapped
 * as a JSON string (`{"priorities": "{\"priorities\":[...]}"}`) instead of a
 * native array — a known model quirk, not a schema violation. Unwraps until
 * an actual array turns up, or gives up and returns an empty one.
 */
function extractPriorities(input) {
  let value = input?.priorities;
  for (let i = 0; i < 3 && typeof value === "string"; i += 1) {
    try {
      const parsed = JSON.parse(value);
      value = parsed?.priorities ?? parsed;
    } catch {
      break;
    }
  }
  return Array.isArray(value) ? value : [];
}

/**
 * Asks Claude to rank an event's casualties by evacuation priority (based on
 * their injuries + logged treatments) and writes the resulting priority onto
 * each casualty row. Only casualties that actually belong to this event are
 * ever updated — any hallucinated/foreign casualtyId in the model's response
 * is dropped rather than trusted.
 */
async function setEvacPriorities(eventId) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable");
  }

  const [casualties, treatments] = await Promise.all([
    casualtiesModel.get_casualties_by_event(eventId),
    casualtiesTreatmentModel.get_casualty_treatments_by_event(eventId),
  ]);

  if (casualties.length === 0) {
    return [];
  }

  // Named treatmentLog, not treatments — casualties already has its own
  // native `treatments` checklist column, and reusing that key would
  // silently overwrite it with just this table's rows.
  const casualtiesWithTreatments = casualties.map((casualty) => ({
    ...casualty,
    treatmentLog: treatments.filter((treatment) => treatment["injury-id"] === casualty.id),
  }));

  // Grounds the ranking in the actual trauma manual rather than the model's
  // own unaided judgment — same embeddings/retrieval pipeline as the
  // medic-query PDF Q&A feature, reusing its cached embedder/index.
  const [embeddedChunks, queryEmbedding] = await Promise.all([
    medicQueryModel.embeddedChunksPromise,
    medicQueryModel.embedQuery(buildTriageQuery(casualties)),
  ]);
  const referenceExcerpts = medicQueryModel
    .retrieveTopK(embeddedChunks, queryEmbedding, TRIAGE_EXCERPT_COUNT)
    .map((chunk, index) => `[${index + 1}] ${chunk.text}`)
    .join("\n\n");

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [PRIORITY_TOOL],
    tool_choice: { type: "tool", name: "assign_evac_priorities" },
    messages: [
      {
        role: "user",
        content: `Reference excerpts from the trauma manual:\n${referenceExcerpts}\n\nCasualties:\n${JSON.stringify(casualtiesWithTreatments, null, 2)}`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse) {
    throw new Error("AI did not return a priority assignment");
  }

  const validCasualtyIds = new Set(casualties.map((casualty) => casualty.id));
  const validPriorities = extractPriorities(toolUse.input).filter(({ casualtyId }) =>
    validCasualtyIds.has(casualtyId),
  );

  return Promise.all(
    validPriorities.map(({ casualtyId, priority }) =>
      casualtiesModel.update_casualty(casualtyId, { evacPriority: priority }),
    ),
  );
}

module.exports = { setEvacPriorities };
