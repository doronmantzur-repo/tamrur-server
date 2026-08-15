const casualtiesTreatmentModel = require("../modules/casualtiesTreatmentModel.js");

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

async function create_casualty_treatment(req, res, next) {
  try {
    console.log(req.body);
    const { eventId, injuryId, treatment, recordedAt } = req.body;

    if (!eventId) {
      throw { status: 400, message: "eventId missing" };
    }

    validateRecordedAt(recordedAt);

    const casualtyTreatment = await casualtiesTreatmentModel.create_casualty_treatment({
      eventId,
      injuryId,
      treatment,
      recordedAt,
    });
    res.status(201).json({ casualtyTreatment });
  } catch (err) {
    next(err);
  }
}

async function update_casualty_treatment(req, res, next) {
  try {
    console.log(req.body);
    const { eventId } = req.params;
    const { injuryId, treatment, recordedAt } = req.body;

    if (injuryId === undefined && treatment === undefined && recordedAt === undefined) {
      throw { status: 400, message: "at least one field must be provided" };
    }

    validateRecordedAt(recordedAt);

    const casualtyTreatment = await casualtiesTreatmentModel.update_casualty_treatment(eventId, {
      injuryId,
      treatment,
      recordedAt,
    });
    res.status(200).json({ casualtyTreatment });
  } catch (err) {
    next(err);
  }
}

/**
 * Updates a single treatment row, addressed by its own id.
 */
async function update_casualty_treatment_by_id(req, res, next) {
  try {
    console.log(req.body);
    const { id } = req.params;
    const { injuryId, treatment, recordedAt } = req.body;

    if (injuryId === undefined && treatment === undefined && recordedAt === undefined) {
      throw { status: 400, message: "at least one field must be provided" };
    }

    validateRecordedAt(recordedAt);

    const casualtyTreatment = await casualtiesTreatmentModel.update_casualty_treatment_by_id(id, {
      injuryId,
      treatment,
      recordedAt,
    });
    res.status(200).json({ casualtyTreatment });
  } catch (err) {
    next(err);
  }
}

async function delete_casualty_treatment(req, res, next) {
  try {
    const { eventId } = req.params;
    const casualtyTreatment = await casualtiesTreatmentModel.delete_casualty_treatment(eventId);
    res.status(200).json({ casualtyTreatment });
  } catch (err) {
    next(err);
  }
}

/**
 * Deletes a single treatment row, addressed by its own id.
 */
async function delete_casualty_treatment_by_id(req, res, next) {
  try {
    const { id } = req.params;
    const casualtyTreatment = await casualtiesTreatmentModel.delete_casualty_treatment_by_id(id);
    res.status(200).json({ casualtyTreatment });
  } catch (err) {
    next(err);
  }
}

async function get_casualty_treatment_by_event(req, res, next) {
  try {
    const { eventId } = req.params;
    const casualtyTreatment = await casualtiesTreatmentModel.get_casualty_treatment_by_event(eventId);
    res.status(200).json({ casualtyTreatment });
  } catch (err) {
    next(err);
  }
}

/**
 * Every treatment logged across one event — what the medic interface loads
 * when an event is selected.
 */
async function get_casualty_treatments_by_event(req, res, next) {
  try {
    const { eventId } = req.params;
    const casualtyTreatments = await casualtiesTreatmentModel.get_casualty_treatments_by_event(eventId);
    res.status(200).json({ casualtyTreatments });
  } catch (err) {
    next(err);
  }
}

/**
 * Every treatment logged for one casualty.
 */
async function get_casualty_treatments_by_injury(req, res, next) {
  try {
    const { injuryId } = req.params;
    const casualtyTreatments = await casualtiesTreatmentModel.get_casualty_treatments_by_injury(injuryId);
    res.status(200).json({ casualtyTreatments });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create_casualty_treatment,
  update_casualty_treatment,
  update_casualty_treatment_by_id,
  delete_casualty_treatment,
  delete_casualty_treatment_by_id,
  get_casualty_treatment_by_event,
  get_casualty_treatments_by_event,
  get_casualty_treatments_by_injury,
};
