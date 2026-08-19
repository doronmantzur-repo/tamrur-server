const { sequelize } = require("../db/models");

async function get_forces() {
  const query =
    "SELECT id, type, subtype, brigade, battalion, ST_AsGeoJSON(location)::json AS location FROM forces;";
  try {
    const [result] = await sequelize.query(query);
    return result;
  } catch (error) {
    throw new Error("Error fetching forces");
  }
}

module.exports = { get_forces };
