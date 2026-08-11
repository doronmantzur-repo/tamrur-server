const eventsModel = require("../modules/eventsModel.js");

async function create_event(req, res, next) {
  try {
    console.log(req.body);
    const { name, type, location } = req.body;

    if (!type || !location) {
      throw { status: 400, message: "type or location missing" };
    }

    const event = await eventsModel.create_event({ name, type, location });
    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
}

async function list_events(req, res, next) {
  try {
    const events = await eventsModel.list_events();
    res.status(200).json({ events });
  } catch (err) {
    next(err);
  }
}

async function get_event_by_id(req, res, next) {
  try {
    const { id } = req.params;
    const event = await eventsModel.get_event_by_id(id);
    res.status(200).json({ event });
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

module.exports = { create_event, list_events, get_event_by_id, update_event };
