const injuriesEvacModel = require("../modules/injuriesEvacModel.js");

async function create_injury_evac(req, res, next) {
  try {
    console.log(req.body);
    const { eventId, injuryId, evacuationId } = req.body;

    if (!eventId || !injuryId || !evacuationId) {
      throw { status: 400, message: "eventId, injuryId and evacuationId are required" };
    }

    const injuryEvac = await injuriesEvacModel.create_injury_evac({ eventId, injuryId, evacuationId });
    res.status(201).json({ injuryEvac });
  } catch (err) {
    next(err);
  }
}

async function update_injury_evac(req, res, next) {
  try {
    console.log(req.body);
    const { id } = req.params;
    const { eventId, injuryId, evacuationId } = req.body;

    if (eventId === undefined && injuryId === undefined && evacuationId === undefined) {
      throw { status: 400, message: "at least one field must be provided" };
    }

    const injuryEvac = await injuriesEvacModel.update_injury_evac(id, { eventId, injuryId, evacuationId });
    res.status(200).json({ injuryEvac });
  } catch (err) {
    next(err);
  }
}

async function get_injury_evac_by_event(req, res, next) {
  try {
    const { eventId } = req.params;
    const injuryEvacLinks = await injuriesEvacModel.get_injury_evac_by_event(eventId);
    res.status(200).json({ injuryEvacLinks });
  } catch (err) {
    next(err);
  }
}

module.exports = { create_injury_evac, update_injury_evac, get_injury_evac_by_event };
