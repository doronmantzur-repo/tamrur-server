const eventsModel = require("../modules/eventsModel.js");

async function create_event(req, res, next) {
  try {
    console.log(req.body);
    const { name, type, location } = req.body;

    if (!type || !location) {
      throw { status: 400, message: "type or location missing" };
    }

    const event = await eventsModel.create_event({ name, type, location });
    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
}

async function list_events(req, res, next) {
  try {
    const events = await eventsModel.list_events();
    res.status(200).json({ events });
  } catch (err) {
    next(err);
  }
}

async function get_event_by_id(req, res, next) {
  try {
    const { id } = req.params;
    const event = await eventsModel.get_event_by_id(id);
    res.status(200).json({ event });
  } catch (err) {
    next(err);
  }
}

const AERIAL_EVAC_VALUES = [
  "no_needed",
  "needed",
  "in_progress",
  "approved",
  "denied",
];
const STATUS_VALUES = [
  "evaluated",
  "controlled",
  "ready_for_evacuation",
  "evacuation_started",
  "completed",
];

// Whether the medics are still collecting casualties at the scene. Feeds the
// event's derived evac_status ('pending' | 'initiated' | 'full') — see
// db/migrations/006_evac_status_enum.sql.
const GATHERING_STATUS_VALUES = ["in_progress", "completed"];

async function update_event(req, res, next) {
  try {
    console.log(req.body);
    const { id } = req.params;
    const { name, status, closure_at, type, location, aerialEvac, gatheringStatus } = req.body;

    if (!name && !status && !closure_at && !type && !location && !aerialEvac && !gatheringStatus) {
      throw {
        status: 400,
        message:
          "name, status, closure_at, type, location, aerialEvac or gatheringStatus required",
      };
    }

    if (gatheringStatus !== undefined && !GATHERING_STATUS_VALUES.includes(gatheringStatus)) {
      throw {
        status: 400,
        message: `gatheringStatus must be one of: ${GATHERING_STATUS_VALUES.join(", ")}`,
      };
    }

    if (status !== undefined && !STATUS_VALUES.includes(status)) {
      throw {
        status: 400,
        message: `status must be one of: ${STATUS_VALUES.join(", ")}`,
      };
    }

    if (aerialEvac !== undefined && !AERIAL_EVAC_VALUES.includes(aerialEvac)) {
      throw {
        status: 400,
        message: `aerialEvac must be one of: ${AERIAL_EVAC_VALUES.join(", ")}`,
      };
    }

    const event = await eventsModel.update_event(id, {
      name,
      status,
      closure_at,
      type,
      location,
      aerialEvac,
      gatheringStatus,
    });
    res.status(200).json({ event });
  } catch (err) {
    next(err);
  }
}

module.exports = { create_event, list_events, get_event_by_id, update_event };
