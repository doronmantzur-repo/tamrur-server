const { sequelize } = require("../db/models");

async function create_casualty_evac(data) {
  const query =
    'INSERT INTO "casualties-evac" (event, injurey, evacuation) VALUES (:eventId, :injuryId, :evacuationId) RETURNING *;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        eventId: data.eventId,
        injuryId: data.injuryId,
        evacuationId: data.evacuationId,
      },
    });
    return result[0];
  } catch (error) {
    throw new Error("Error creating casualty-evacuation link");
  }
}

async function update_casualty_evac(id, updates) {
  const query =
    'UPDATE "casualties-evac" SET event = COALESCE(:eventId, event), injurey = COALESCE(:injuryId, injurey), evacuation = COALESCE(:evacuationId, evacuation) WHERE id = :id RETURNING *;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        id,
        eventId: updates.eventId ?? null,
        injuryId: updates.injuryId ?? null,
        evacuationId: updates.evacuationId ?? null,
      },
    });
    const link = result[0];
    if (!link) {
      throw { status: 404, message: "Casualty-evacuation link not found" };
    }
    return link;
  } catch (error) {
    if (error.status) throw error;
    throw new Error("Error updating casualty-evacuation link");
  }
}

async function get_casualty_evac_by_event(eventId) {
  const query = 'SELECT * FROM "casualties-evac" WHERE event = :eventId ORDER BY created_at DESC;';
  try {
    const [result] = await sequelize.query(query, { replacements: { eventId } });
    return result;
  } catch (error) {
    throw new Error("Error fetching casualty-evacuation links");
  }
}

module.exports = { create_casualty_evac, update_casualty_evac, get_casualty_evac_by_event };
