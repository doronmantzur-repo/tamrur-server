const eventsModel = require("../modules/eventsModel.js");

async function create_event(req, res, next) {
  try {
    console.log(req.body);
    const { type, location } = req.body;

    if (!type || !location) {
      throw { status: 400, message: "type or location missing" };
    }

    const event = await eventsModel.create_event({ type, location });
    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
}

async function update_event(req, res, next) {
  try {
    console.log(req.body);
    const { id } = req.params;
    const { name, status } = req.body;

    if (!name && !status) {
      throw { status: 400, message: "name or status required" };
    }

    const event = await eventsModel.update_event(id, { name, status });
    res.status(200).json({ event });
  } catch (err) {
    next(err);
  }
}

module.exports = { create_event, update_event };
