const { sequelize } = require("../db/models");

async function create_injury_treatment(data) {
  const query =
    'INSERT INTO "injuries-treatment" ("event-id", "injury-id", treatment) VALUES (:eventId, :injuryId, :treatment) RETURNING *;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        eventId: data.eventId,
        injuryId: data.injuryId ?? null,
        treatment: data.treatment ?? null,
      },
    });
    return result[0];
  } catch (error) {
    throw new Error("Error creating injury treatment record");
  }
}

async function update_injury_treatment(eventId, updates) {
  const query =
    'UPDATE "injuries-treatment" SET "injury-id" = COALESCE(:injuryId, "injury-id"), treatment = COALESCE(:treatment, treatment) WHERE "event-id" = :eventId RETURNING *;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        eventId,
        injuryId: updates.injuryId ?? null,
        treatment: updates.treatment ?? null,
      },
    });
    const record = result[0];
    if (!record) {
      throw { status: 404, message: "Injury treatment record not found" };
    }
    return record;
  } catch (error) {
    if (error.status) throw error;
    throw new Error("Error updating injury treatment record");
  }
}

async function delete_injury_treatment(eventId) {
  const query = 'DELETE FROM "injuries-treatment" WHERE "event-id" = :eventId RETURNING *;';
  try {
    const [result] = await sequelize.query(query, { replacements: { eventId } });
    const record = result[0];
    if (!record) {
      throw { status: 404, message: "Injury treatment record not found" };
    }
    return record;
  } catch (error) {
    if (error.status) throw error;
    throw new Error("Error deleting injury treatment record");
  }
}

async function get_injury_treatment_by_event(eventId) {
  const query = 'SELECT * FROM "injuries-treatment" WHERE "event-id" = :eventId;';
  try {
    const [result] = await sequelize.query(query, { replacements: { eventId } });
    return result[0] ?? null;
  } catch (error) {
    throw new Error("Error fetching injury treatment record");
  }
}

module.exports = {
  create_injury_treatment,
  update_injury_treatment,
  delete_injury_treatment,
  get_injury_treatment_by_event,
};
