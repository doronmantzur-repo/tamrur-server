const vitalsModel = require("../modules/vitalsModel.js");

/**
 * Rejects anything Postgres can't read as a timestamp before it reaches the
 * query, so a malformed value comes back as a 400 rather than a generic 500.
 */
function validateRecordedAt(recordedAt) {
  if (recordedAt === undefined || recordedAt === null) return;

  if (typeof recordedAt !== "string" || Number.isNaN(new Date(recordedAt).getTime())) {
    throw { status: 400, message: "recordedAt must be an ISO 8601 timestamp string" };
  }
}

async function create_vitals(req, res, next) {
  try {
    console.log(req.body);
    const {
      eventId,
      injuryId,
      pulse,
      bloodPressure,
      spo2,
      respiratoryRate,
      oralTemperature,
      rectalTemperature,
      recordedAt,
    } = req.body;

    if (!eventId) {
      throw { status: 400, message: "eventId missing" };
    }

    validateRecordedAt(recordedAt);

    const vitals = await vitalsModel.create_vitals({
      eventId,
      injuryId,
      pulse,
      bloodPressure,
      spo2,
      respiratoryRate,
      oralTemperature,
      rectalTemperature,
      recordedAt,
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
    const {
      injuryId,
      pulse,
      bloodPressure,
      spo2,
      respiratoryRate,
      oralTemperature,
      rectalTemperature,
      recordedAt,
    } = req.body;

    if (
      injuryId === undefined &&
      pulse === undefined &&
      bloodPressure === undefined &&
      spo2 === undefined &&
      respiratoryRate === undefined &&
      oralTemperature === undefined &&
      rectalTemperature === undefined &&
      recordedAt === undefined
    ) {
      throw { status: 400, message: "at least one field must be provided" };
    }

    validateRecordedAt(recordedAt);

    const vitals = await vitalsModel.update_vitals(eventId, {
      injuryId,
      pulse,
      bloodPressure,
      spo2,
      respiratoryRate,
      oralTemperature,
      rectalTemperature,
      recordedAt,
    });
    res.status(200).json({ vitals });
  } catch (err) {
    next(err);
  }
}

/**
 * Updates a single vitals row, addressed by its own id.
 */
async function update_vitals_by_id(req, res, next) {
  try {
    console.log(req.body);
    const { id } = req.params;
    const {
      injuryId,
      pulse,
      bloodPressure,
      spo2,
      respiratoryRate,
      oralTemperature,
      rectalTemperature,
      recordedAt,
    } = req.body;

    if (
      injuryId === undefined &&
      pulse === undefined &&
      bloodPressure === undefined &&
      spo2 === undefined &&
      respiratoryRate === undefined &&
      oralTemperature === undefined &&
      rectalTemperature === undefined &&
      recordedAt === undefined
    ) {
      throw { status: 400, message: "at least one field must be provided" };
    }

    validateRecordedAt(recordedAt);

    const vitals = await vitalsModel.update_vitals_by_id(id, {
      injuryId,
      pulse,
      bloodPressure,
      spo2,
      respiratoryRate,
      oralTemperature,
      rectalTemperature,
      recordedAt,
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

/**
 * Deletes a single vitals row, addressed by its own id.
 */
async function delete_vitals_by_id(req, res, next) {
  try {
    const { id } = req.params;
    const vitals = await vitalsModel.delete_vitals_by_id(id);
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

/**
 * Every vitals reading logged across one event — what the medic interface
 * loads when an event is selected.
 */
async function get_vitals_records_by_event(req, res, next) {
  try {
    const { eventId } = req.params;
    const vitalsRecords = await vitalsModel.get_vitals_records_by_event(eventId);
    res.status(200).json({ vitalsRecords });
  } catch (err) {
    next(err);
  }
}

/**
 * Every vitals reading logged for one casualty.
 */
async function get_vitals_records_by_injury(req, res, next) {
  try {
    const { injuryId } = req.params;
    const vitalsRecords = await vitalsModel.get_vitals_records_by_injury(injuryId);
    res.status(200).json({ vitalsRecords });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create_vitals,
  update_vitals,
  update_vitals_by_id,
  delete_vitals,
  delete_vitals_by_id,
  get_vitals_by_event,
  get_vitals_records_by_event,
  get_vitals_records_by_injury,
};