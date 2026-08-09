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

module.exports = { create_event };
