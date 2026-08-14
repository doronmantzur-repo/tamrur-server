const casualtiesModel = require("../modules/casualtiesModel.js");

const URGENCY_VALUES = ["non-urgent", "urgent", "expectant", "deceased"];
const EVAC_ABILITY_VALUES = ["walk", "sit", "lie"];

function validateCasualtyFields({ urgency, evacPriority, escort, evacAbility, evacReady }) {
  if (urgency !== undefined && !URGENCY_VALUES.includes(urgency)) {
    throw { status: 400, message: `urgency must be one of: ${URGENCY_VALUES.join(", ")}` };
  }

  if (evacPriority !== undefined && typeof evacPriority !== "number") {
    throw { status: 400, message: "evac-priority must be a number" };
  }

  if (escort !== undefined && typeof escort !== "boolean") {
    throw { status: 400, message: "escort must be a boolean" };
  }

  if (evacAbility !== undefined && !EVAC_ABILITY_VALUES.includes(evacAbility)) {
    throw { status: 400, message: `evac-ability must be one of: ${EVAC_ABILITY_VALUES.join(", ")}` };
  }

  if (evacReady !== undefined && typeof evacReady !== "boolean") {
    throw { status: 400, message: "evac-ready must be a boolean" };
  }
}

async function create_casualty(req, res, next) {
  try {
    console.log(req.body);
    const {
      eventId,
      urgency,
      "evac-priority": evacPriority,
      escort,
      "recommended-evac-dest": destEvacRecommend,
      "evac-ability": evacAbility,
      "evac-ready": evacReady,
    } = req.body;

    if (!eventId) {
      throw { status: 400, message: "eventId missing" };
    }

    validateCasualtyFields({ urgency, evacPriority, escort, evacAbility, evacReady });

    const casualty = await casualtiesModel.create_casualty({
      eventId,
      urgency,
      evacPriority,
      escort,
      destEvacRecommend,
      evacAbility,
      evacReady,
    });
    res.status(201).json({ casualty });
  } catch (err) {
    next(err);
  }
}

async function update_casualty(req, res, next) {
  try {
    console.log(req.body);
    const { id } = req.params;
    const {
      urgency,
      "evac-priority": evacPriority,
      escort,
      "recommended-evac-dest": destEvacRecommend,
      "evac-ability": evacAbility,
      "evac-ready": evacReady,
    } = req.body;

    if (
      urgency === undefined &&
      evacPriority === undefined &&
      escort === undefined &&
      destEvacRecommend === undefined &&
      evacAbility === undefined &&
      evacReady === undefined
    ) {
      throw { status: 400, message: "at least one field must be provided" };
    }

    validateCasualtyFields({ urgency, evacPriority, escort, evacAbility, evacReady });

    const casualty = await casualtiesModel.update_casualty(id, {
      urgency,
      evacPriority,
      escort,
      destEvacRecommend,
      evacAbility,
      evacReady,
    });
    res.status(200).json({ casualty });
  } catch (err) {
    next(err);
  }
}

async function get_casualties_by_event(req, res, next) {
  try {
    const { eventId } = req.params;
    const casualties = await casualtiesModel.get_casualties_by_event(eventId);
    res.status(200).json({ casualties });
  } catch (err) {
    next(err);
  }
}

module.exports = { create_casualty, update_casualty, get_casualties_by_event };
