const locationsModel = require("../modules/locationsModel.js");

async function get_locations(req, res, next) {
  try {
    const locations = await locationsModel.get_locations();
    res.status(200).json({ locations });
  } catch (err) {
    next(err);
  }
}

module.exports = { get_locations };
