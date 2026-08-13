const evacuationsModel = require("../modules/evacuationsModel.js");

const METHOD_VALUES = ["walk", "ride", "aerial"];
const STATUS_VALUES = ["not_started", "started", "completed"];

async function create_evacuation(req, res, next) {
  try {
    console.log(req.body);
    const {
      eventId,
      method,
      departurePoint,
      forceRadioSign,
      startTime,
      eta,
      aerialMissionId,
      destinationPoint,
    } = req.body;

    if (!eventId) {
      throw { status: 400, message: "eventId missing" };
    }

    if (method !== undefined && !METHOD_VALUES.includes(method)) {
      throw { status: 400, message: `method must be one of: ${METHOD_VALUES.join(", ")}` };
    }

    const evacuation = await evacuationsModel.create_evacuation({
      eventId,
      method,
      departurePoint,
      forceRadioSign,
      startTime,
      eta,
      aerialMissionId,
      destinationPoint,
    });
    res.status(201).json({ evacuation });
  } catch (err) {
    next(err);
  }
}

async function update_evacuation(req, res, next) {
  try {
    console.log(req.body);
    const { id } = req.params;
    const {
      method,
      departurePoint,
      forceRadioSign,
      status,
      startTime,
      eta,
      concludedAt,
      aerialMissionId,
      destinationPoint,
    } = req.body;

    if (
      method === undefined &&
      departurePoint === undefined &&
      forceRadioSign === undefined &&
      status === undefined &&
      startTime === undefined &&
      eta === undefined &&
      concludedAt === undefined &&
      aerialMissionId === undefined &&
      destinationPoint === undefined
    ) {
      throw { status: 400, message: "at least one field must be provided" };
    }

    if (method !== undefined && !METHOD_VALUES.includes(method)) {
      throw { status: 400, message: `method must be one of: ${METHOD_VALUES.join(", ")}` };
    }

    if (status !== undefined && !STATUS_VALUES.includes(status)) {
      throw { status: 400, message: `status must be one of: ${STATUS_VALUES.join(", ")}` };
    }

    const evacuation = await evacuationsModel.update_evacuation(id, {
      method,
      departurePoint,
      forceRadioSign,
      status,
      startTime,
      eta,
      concludedAt,
      aerialMissionId,
      destinationPoint,
    });
    res.status(200).json({ evacuation });
  } catch (err) {
    next(err);
  }
}

async function get_evacuations_by_event(req, res, next) {
  try {
    const { eventId } = req.params;
    const evacuations = await evacuationsModel.get_evacuations_by_event(eventId);
    res.status(200).json({ evacuations });
  } catch (err) {
    next(err);
  }
}

async function delete_evacuation(req, res, next) {
  try {
    const { id } = req.params;
    const evacuation = await evacuationsModel.delete_evacuation(id);
    res.status(200).json({ evacuation });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create_evacuation,
  update_evacuation,
  get_evacuations_by_event,
  delete_evacuation,
};
