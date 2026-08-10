const injuriesModel = require("../modules/injuriesModel.js");

const URGENCY_VALUES = ["non-urgent", "urgent", "expectant", "deceased"];
const EVAC_ABILITY_VALUES = ["walk", "sit", "lie"];

async function create_injury(req, res, next) {
  try {
    console.log(req.body);
    const { eventId, urgency } = req.body;

    if (!eventId) {
      throw { status: 400, message: "eventId missing" };
    }

    if (urgency !== undefined && !URGENCY_VALUES.includes(urgency)) {
      throw { status: 400, message: `urgency must be one of: ${URGENCY_VALUES.join(", ")}` };
    }

    const injury = await injuriesModel.create_injury({ eventId, urgency });
    res.status(201).json({ injury });
  } catch (err) {
    next(err);
  }
}

async function update_injury(req, res, next) {
  try {
    console.log(req.body);
    const { id } = req.params;
    const {
      urgency,
      escort,
      "dest-evac-recommend": destEvacRecommend,
      "evac-ability": evacAbility,
      "evac-ready": evacReady,
    } = req.body;

    if (
      urgency === undefined &&
      escort === undefined &&
      destEvacRecommend === undefined &&
      evacAbility === undefined &&
      evacReady === undefined
    ) {
      throw { status: 400, message: "at least one field must be provided" };
    }

    if (urgency !== undefined && !URGENCY_VALUES.includes(urgency)) {
      throw { status: 400, message: `urgency must be one of: ${URGENCY_VALUES.join(", ")}` };
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

    const injury = await injuriesModel.update_injury(id, {
      urgency,
      escort,
      destEvacRecommend,
      evacAbility,
      evacReady,
    });
    res.status(200).json({ injury });
  } catch (err) {
    next(err);
  }
}

async function get_injuries_by_event(req, res, next) {
  try {
    const { eventId } = req.params;
    const injuries = await injuriesModel.get_injuries_by_event(eventId);
    res.status(200).json({ injuries });
  } catch (err) {
    next(err);
  }
}

module.exports = { create_injury, update_injury, get_injuries_by_event };
