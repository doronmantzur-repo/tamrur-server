const { sequelize } = require("../db/models");

async function get_locations() {
  const query =
    "SELECT id, name, type, is_ok, status_update, ST_AsGeoJSON(location)::json AS location FROM locations;";
  try {
    const [result] = await sequelize.query(query);
    return result;
  } catch (error) {
    throw new Error("Error fetching locations");
  }
}

module.exports = { get_locations };
