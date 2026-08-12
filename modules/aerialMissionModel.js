const { sequelize } = require("../db/models");

async function create_aerial_mission(data) {
  const query =
    'INSERT INTO aerial_mission (radio_sign, landing_pad_id, "request-status") VALUES (:radioSign, :landingPadId, :requestStatus) RETURNING *;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        radioSign: data.radioSign ?? null,
        landingPadId: data.landingPadId ?? null,
        requestStatus: data.requestStatus ?? null,
      },
    });
    return result[0];
  } catch (error) {
    throw new Error("Error creating aerial mission");
  }
}

async function update_aerial_mission(id, updates) {
  const query =
    'UPDATE aerial_mission SET radio_sign = COALESCE(:radioSign, radio_sign), landing_pad_id = COALESCE(:landingPadId, landing_pad_id), "request-status" = COALESCE(:requestStatus, "request-status") WHERE id = :id RETURNING *;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        id,
        radioSign: updates.radioSign ?? null,
        landingPadId: updates.landingPadId ?? null,
        requestStatus: updates.requestStatus ?? null,
      },
    });
    const mission = result[0];
    if (!mission) {
      throw { status: 404, message: "Aerial mission not found" };
    }
    return mission;
  } catch (error) {
    if (error.status) throw error;
    throw new Error("Error updating aerial mission");
  }
}

async function list_aerial_missions() {
  const query = "SELECT * FROM aerial_mission ORDER BY created_at DESC;";
  try {
    const [result] = await sequelize.query(query);
    return result;
  } catch (error) {
    throw new Error("Error fetching aerial missions");
  }
}

module.exports = { create_aerial_mission, update_aerial_mission, list_aerial_missions };
