const landingPadsModel = require("../modules/landingPadsModel.js");

async function get_landing_pads(req, res, next) {
  try {
    const landingPads = await landingPadsModel.get_landing_pads();
    res.status(200).json({ landingPads });
  } catch (err) {
    next(err);
  }
}

module.exports = { get_landing_pads };
