const eventsModel = require("../modules/eventsModel.js");
const { CLOSED_STATUS } = require("../constants/eventStatus.js");

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

// Whether the medics are still collecting casualties at the scene. Feeds the
// event's derived evac_status and status — see
// db/migrations/007_event_status_enum.sql.
const GATHERING_STATUS_VALUES = ["in_progress", "completed"];

async function update_event(req, res, next) {
  try {
    console.log(req.body);
    const { id } = req.params;
    const { name, type, location, aerialEvac, gatheringStatus, status } = req.body;

    if (status !== undefined) {
      throw {
        status: 400,
        message: `status is derived automatically and cannot be set directly; use POST /events/:id/close to reach '${CLOSED_STATUS}'`,
      };
    }

    if (!name && !type && !location && !aerialEvac && !gatheringStatus) {
      throw {
        status: 400,
        message: "name, type, location, aerialEvac or gatheringStatus required",
      };
    }

    if (gatheringStatus !== undefined && !GATHERING_STATUS_VALUES.includes(gatheringStatus)) {
      throw {
        status: 400,
        message: `gatheringStatus must be one of: ${GATHERING_STATUS_VALUES.join(", ")}`,
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

// status is otherwise fully derived (see recalc_event_evac_status); closing
// is the one manual, one-way transition, gated on the event currently being
// full_evacuation. The model's UPDATE ... WHERE status = 'full_evacuation'
// is the actual guard; this endpoint just surfaces 404 vs 409 appropriately.
async function close_event(req, res, next) {
  try {
    const { id } = req.params;
    const event = await eventsModel.close_event(id);
    res.status(200).json({ event });
  } catch (err) {
    next(err);
  }
}

module.exports = { create_event, list_events, get_event_by_id, update_event, close_event };
