const forcesModel = require("../modules/forcesModel.js");

async function get_forces(req, res, next) {
  try {
    const forces = await forcesModel.get_forces();
    res.status(200).json({ forces });
  } catch (err) {
    next(err);
  }
}

module.exports = { get_forces };
