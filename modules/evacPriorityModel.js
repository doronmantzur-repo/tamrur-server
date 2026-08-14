const Anthropic = require("@anthropic-ai/sdk");
const injuriesModel = require("./injuriesModel.js");
const injuriesTreatmentModel = require("./injuriesTreatmentModel.js");
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
            injuryId: { type: "string" },
            priority: { type: "integer", minimum: 1 },
          },
          required: ["injuryId", "priority"],
        },
      },
    },
    required: ["priorities"],
  },
};

const SYSTEM_PROMPT =
  "You are a combat medic triage assistant. You are given: (1) reference excerpts, in Hebrew, from " +
  "the unit's official trauma/combat-casualty-care manual describing triage and evacuation-priority " +
  "principles, and (2) a JSON list of an event's casualties (injuries) and the treatments logged for " +
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
function buildTriageQuery(injuries) {
  const urgencies = [...new Set(injuries.map((injury) => injury.urgency).filter(Boolean))];
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
 * each injury row. Only injuries that actually belong to this event are ever
 * updated — any hallucinated/foreign injuryId in the model's response is
 * dropped rather than trusted.
 */
async function setEvacPriorities(eventId) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable");
  }

  const [injuries, treatments] = await Promise.all([
    injuriesModel.get_injuries_by_event(eventId),
    injuriesTreatmentModel.get_injury_treatments_by_event(eventId),
  ]);

  if (injuries.length === 0) {
    return [];
  }

  // Named treatmentLog, not treatments — injuries already has its own native
  // `treatments` checklist column, and reusing that key would silently
  // overwrite it with just this table's rows.
  const injuriesWithTreatments = injuries.map((injury) => ({
    ...injury,
    treatmentLog: treatments.filter((treatment) => treatment["injury-id"] === injury.id),
  }));

  // Grounds the ranking in the actual trauma manual rather than the model's
  // own unaided judgment — same embeddings/retrieval pipeline as the
  // medic-query PDF Q&A feature, reusing its cached embedder/index.
  const [embeddedChunks, queryEmbedding] = await Promise.all([
    medicQueryModel.embeddedChunksPromise,
    medicQueryModel.embedQuery(buildTriageQuery(injuries)),
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
        content: `Reference excerpts from the trauma manual:\n${referenceExcerpts}\n\nCasualties:\n${JSON.stringify(injuriesWithTreatments, null, 2)}`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse) {
    throw new Error("AI did not return a priority assignment");
  }

  const validInjuryIds = new Set(injuries.map((injury) => injury.id));
  const validPriorities = extractPriorities(toolUse.input).filter(({ injuryId }) => validInjuryIds.has(injuryId));

  return Promise.all(
    validPriorities.map(({ injuryId, priority }) =>
      injuriesModel.update_injury(injuryId, { evacPriority: priority }),
    ),
  );
}

module.exports = { setEvacPriorities };
