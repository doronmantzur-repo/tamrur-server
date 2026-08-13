const { sequelize } = require("../db/models");

async function get_landing_pads() {
  const query =
    "SELECT id, name, is_ok, status_update, ST_AsGeoJSON(location)::json AS location FROM landing_pads;";
  try {
    const [result] = await sequelize.query(query);
    return result;
  } catch (error) {
    throw new Error("Error fetching landing pads");
  }
}

module.exports = { get_landing_pads };
