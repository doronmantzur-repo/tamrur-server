const injuriesTreatmentModel = require("../modules/injuriesTreatmentModel.js");

async function create_injury_treatment(req, res, next) {
  try {
    console.log(req.body);
    const { eventId, injuryId, treatment } = req.body;

    if (!eventId) {
      throw { status: 400, message: "eventId missing" };
    }

    const injuryTreatment = await injuriesTreatmentModel.create_injury_treatment({ eventId, injuryId, treatment });
    res.status(201).json({ injuryTreatment });
  } catch (err) {
    next(err);
  }
}

async function update_injury_treatment(req, res, next) {
  try {
    console.log(req.body);
    const { eventId } = req.params;
    const { injuryId, treatment } = req.body;

    if (injuryId === undefined && treatment === undefined) {
      throw { status: 400, message: "at least one field must be provided" };
    }

    const injuryTreatment = await injuriesTreatmentModel.update_injury_treatment(eventId, { injuryId, treatment });
    res.status(200).json({ injuryTreatment });
  } catch (err) {
    next(err);
  }
}

async function delete_injury_treatment(req, res, next) {
  try {
    const { eventId } = req.params;
    const injuryTreatment = await injuriesTreatmentModel.delete_injury_treatment(eventId);
    res.status(200).json({ injuryTreatment });
  } catch (err) {
    next(err);
  }
}

async function get_injury_treatment_by_event(req, res, next) {
  try {
    const { eventId } = req.params;
    const injuryTreatment = await injuriesTreatmentModel.get_injury_treatment_by_event(eventId);
    res.status(200).json({ injuryTreatment });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create_injury_treatment,
  update_injury_treatment,
  delete_injury_treatment,
  get_injury_treatment_by_event,
};
