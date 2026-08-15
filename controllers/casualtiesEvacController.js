const casualtiesEvacModel = require("../modules/casualtiesEvacModel.js");

async function create_casualty_evac(req, res, next) {
  try {
    console.log(req.body);
    const { eventId, injuryId, evacuationId } = req.body;

    if (!eventId || !injuryId || !evacuationId) {
      throw { status: 400, message: "eventId, injuryId and evacuationId are required" };
    }

    const casualtyEvac = await casualtiesEvacModel.create_casualty_evac({ eventId, injuryId, evacuationId });
    res.status(201).json({ casualtyEvac });
  } catch (err) {
    next(err);
  }
}

async function update_casualty_evac(req, res, next) {
  try {
    console.log(req.body);
    const { id } = req.params;
    const { eventId, injuryId, evacuationId } = req.body;

    if (eventId === undefined && injuryId === undefined && evacuationId === undefined) {
      throw { status: 400, message: "at least one field must be provided" };
    }

    const casualtyEvac = await casualtiesEvacModel.update_casualty_evac(id, { eventId, injuryId, evacuationId });
    res.status(200).json({ casualtyEvac });
  } catch (err) {
    next(err);
  }
}

async function get_casualty_evac_by_event(req, res, next) {
  try {
    const { eventId } = req.params;
    const casualtyEvacLinks = await casualtiesEvacModel.get_casualty_evac_by_event(eventId);
    res.status(200).json({ casualtyEvacLinks });
  } catch (err) {
    next(err);
  }
}

module.exports = { create_casualty_evac, update_casualty_evac, get_casualty_evac_by_event };
