const vitalsModel = require("../modules/vitalsModel.js");

async function create_vitals(req, res, next) {
  try {
    console.log(req.body);
    const { eventId, injuryId, pulse, bloodPressure, spo2, respiratoryRate, oralTemperature, rectalTemperature } =
      req.body;

    if (!eventId) {
      throw { status: 400, message: "eventId missing" };
    }

    const vitals = await vitalsModel.create_vitals({
      eventId,
      injuryId,
      pulse,
      bloodPressure,
      spo2,
      respiratoryRate,
      oralTemperature,
      rectalTemperature,
    });
    res.status(201).json({ vitals });
  } catch (err) {
    next(err);
  }
}

async function update_vitals(req, res, next) {
  try {
    console.log(req.body);
    const { eventId } = req.params;
    const { injuryId, pulse, bloodPressure, spo2, respiratoryRate, oralTemperature, rectalTemperature } = req.body;

    if (
      injuryId === undefined &&
      pulse === undefined &&
      bloodPressure === undefined &&
      spo2 === undefined &&
      respiratoryRate === undefined &&
      oralTemperature === undefined &&
      rectalTemperature === undefined
    ) {
      throw { status: 400, message: "at least one field must be provided" };
    }

    const vitals = await vitalsModel.update_vitals(eventId, {
      injuryId,
      pulse,
      bloodPressure,
      spo2,
      respiratoryRate,
      oralTemperature,
      rectalTemperature,
    });
    res.status(200).json({ vitals });
  } catch (err) {
    next(err);
  }
}

async function delete_vitals(req, res, next) {
  try {
    const { eventId } = req.params;
    const vitals = await vitalsModel.delete_vitals(eventId);
    res.status(200).json({ vitals });
  } catch (err) {
    next(err);
  }
}

async function get_vitals_by_event(req, res, next) {
  try {
    const { eventId } = req.params;
    const vitals = await vitalsModel.get_vitals_by_event(eventId);
    res.status(200).json({ vitals });
  } catch (err) {
    next(err);
  }
}

module.exports = { create_vitals, update_vitals, delete_vitals, get_vitals_by_event };
