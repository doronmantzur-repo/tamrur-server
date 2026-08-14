const evacPriorityModel = require("../modules/evacPriorityModel.js");

async function set_evac_priority(req, res, next) {
  try {
    const { eventId } = req.params;
    const casualties = await evacPriorityModel.setEvacPriorities(eventId);
    res.status(200).json({ casualties });
  } catch (err) {
    next(err);
  }
}

module.exports = { set_evac_priority };
