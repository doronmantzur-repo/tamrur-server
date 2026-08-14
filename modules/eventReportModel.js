const fs = require("fs/promises");
const path = require("path");
const eventsModel = require("./eventsModel.js");
const casualtiesModel = require("./casualtiesModel.js");
const injuriesTreatmentModel = require("./injuriesTreatmentModel.js");
const vitalsModel = require("./vitalsModel.js");
const evacuationsModel = require("./evacuationsModel.js");
const aerialMissionModel = require("./aerialMissionModel.js");

// Persisted to disk (not memory) so the cache survives server restarts —
// one JSON file per event under CACHE_DIR. The report page only ever targets
// completed events, which shouldn't keep changing, so entries are kept
// indefinitely rather than expired.
const CACHE_DIR = path.join(__dirname, "..", "data", "report-cache");
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * eventId ends up in a filesystem path — only ever build one from a value
 * that's already a well-formed UUID, never straight from request input, to
 * rule out path traversal via a crafted :eventId param.
 */
function cacheFilePath(eventId) {
  if (!UUID_PATTERN.test(eventId)) return null;
  return path.join(CACHE_DIR, `${eventId}.json`);
}

async function getCached(eventId) {
  const filePath = cacheFilePath(eventId);
  if (!filePath) return null;

  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function setCached(eventId, data) {
  const filePath = cacheFilePath(eventId);
  if (!filePath) return;

  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data));
}

/**
 * Pulls every record logged against one event across the domain tables.
 * The event-report template is a fixed form (name, type, status, times,
 * per-casualty fields) whose values are all literal DB data, so there's
 * nothing for an LLM to write — the client fills the template directly from
 * this bundle.
 *
 * Cached to disk under data/report-cache/<eventId>.json so repeat requests
 * for the same event — from any client, across server restarts — don't
 * re-query Supabase.
 */
async function getEventReportData(eventId) {
  const cached = await getCached(eventId);
  if (cached) return cached;

  // Throws a 404 if the event doesn't exist.
  const event = await eventsModel.get_event_by_id(eventId);

  const [casualties, treatments, vitalsRecords, evacuations, aerialMissions] = await Promise.all([
    casualtiesModel.get_casualties_by_event(eventId),
    injuriesTreatmentModel.get_injury_treatments_by_event(eventId),
    vitalsModel.get_vitals_records_by_event(eventId),
    evacuationsModel.get_evacuations_by_event(eventId),
    aerialMissionModel.get_aerial_missions_by_event(eventId),
  ]);

  const data = { event, casualties, treatments, vitalsRecords, evacuations, aerialMissions };
  await setCached(eventId, data);
  return data;
}

module.exports = { getEventReportData };
