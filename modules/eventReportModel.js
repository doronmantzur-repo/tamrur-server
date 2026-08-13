const eventsModel = require("./eventsModel.js");
const injuriesModel = require("./injuriesModel.js");
const injuriesTreatmentModel = require("./injuriesTreatmentModel.js");
const vitalsModel = require("./vitalsModel.js");
const evacuationsModel = require("./evacuationsModel.js");
const aerialMissionModel = require("./aerialMissionModel.js");

/**
 * Pulls every record logged against one event across the domain tables.
 * The event-report template is a fixed form (name, type, status, times,
 * per-casualty fields) whose values are all literal DB data, so there's
 * nothing for an LLM to write — the client fills the template directly from
 * this bundle.
 */
async function getEventReportData(eventId) {
  // Throws a 404 if the event doesn't exist.
  const event = await eventsModel.get_event_by_id(eventId);

  const [injuries, treatments, vitalsRecords, evacuations, aerialMissions] = await Promise.all([
    injuriesModel.get_injuries_by_event(eventId),
    injuriesTreatmentModel.get_injury_treatments_by_event(eventId),
    vitalsModel.get_vitals_records_by_event(eventId),
    evacuationsModel.get_evacuations_by_event(eventId),
    aerialMissionModel.get_aerial_missions_by_event(eventId),
  ]);

  return { event, injuries, treatments, vitalsRecords, evacuations, aerialMissions };
}

module.exports = { getEventReportData };
