const { sequelize } = require("../db/models");

/**
 * Logs the underlying Postgres error, then returns the caller-facing one.
 *
 * Without this the real cause (a missing column, a constraint violation) is
 * discarded and the client just sees an opaque 500 with nothing written down
 * anywhere. Errors that already carry a status — the 404s below — pass through
 * untouched.
 */
function dbError(error, message) {
  if (error?.status) return error;

  console.error(message, error);
  return new Error(message);
}

async function create_injury_treatment(data) {
  const query =
    'INSERT INTO "injuries-treatment" ("event-id", "injury-id", treatment, "recorded-at") VALUES (:eventId, :injuryId, :treatment, COALESCE(:recordedAt, now())) RETURNING *;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        eventId: data.eventId,
        injuryId: data.injuryId ?? null,
        treatment: data.treatment ?? null,
        recordedAt: data.recordedAt ?? null,
      },
    });
    return result[0];
  } catch (error) {
    throw dbError(error, "Error creating injury treatment record");
  }
}

async function update_injury_treatment(eventId, updates) {
  const query =
    'UPDATE "injuries-treatment" SET "injury-id" = COALESCE(:injuryId, "injury-id"), treatment = COALESCE(:treatment, treatment), "recorded-at" = COALESCE(:recordedAt, "recorded-at") WHERE "event-id" = :eventId RETURNING *;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        eventId,
        injuryId: updates.injuryId ?? null,
        treatment: updates.treatment ?? null,
        recordedAt: updates.recordedAt ?? null,
      },
    });
    const record = result[0];
    if (!record) {
      throw { status: 404, message: "Injury treatment record not found" };
    }
    return record;
  } catch (error) {
    throw dbError(error, "Error updating injury treatment record");
  }
}

/**
 * Updates one treatment row by its own primary key.
 *
 * The event-scoped update above rewrites every row belonging to the event,
 * which is wrong once a casualty has more than one treatment logged — the
 * medic interface addresses records individually through this instead.
 */
async function update_injury_treatment_by_id(id, updates) {
  const query =
    'UPDATE "injuries-treatment" SET "injury-id" = COALESCE(:injuryId, "injury-id"), treatment = COALESCE(:treatment, treatment), "recorded-at" = COALESCE(:recordedAt, "recorded-at") WHERE id = :id RETURNING *;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        id,
        injuryId: updates.injuryId ?? null,
        treatment: updates.treatment ?? null,
        recordedAt: updates.recordedAt ?? null,
      },
    });
    const record = result[0];
    if (!record) {
      throw { status: 404, message: "Injury treatment record not found" };
    }
    return record;
  } catch (error) {
    throw dbError(error, "Error updating injury treatment record");
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
    throw dbError(error, "Error deleting injury treatment record");
  }
}

/**
 * Deletes one treatment row by its own primary key, leaving the casualty's
 * other treatments untouched.
 */
async function delete_injury_treatment_by_id(id) {
  const query = 'DELETE FROM "injuries-treatment" WHERE id = :id RETURNING *;';
  try {
    const [result] = await sequelize.query(query, { replacements: { id } });
    const record = result[0];
    if (!record) {
      throw { status: 404, message: "Injury treatment record not found" };
    }
    return record;
  } catch (error) {
    throw dbError(error, "Error deleting injury treatment record");
  }
}

async function get_injury_treatment_by_event(eventId) {
  const query = 'SELECT * FROM "injuries-treatment" WHERE "event-id" = :eventId;';
  try {
    const [result] = await sequelize.query(query, { replacements: { eventId } });
    return result[0] ?? null;
  } catch (error) {
    throw dbError(error, "Error fetching injury treatment record");
  }
}

/**
 * Every treatment logged across an event, newest first.
 *
 * The medic interface shows a whole event's casualties at once, so it pulls
 * the event's treatments in one request and groups them by "injury-id"
 * client-side rather than issuing one request per casualty.
 */
async function get_injury_treatments_by_event(eventId) {
  const query =
    'SELECT * FROM "injuries-treatment" WHERE "event-id" = :eventId ORDER BY "recorded-at" DESC;';
  try {
    const [result] = await sequelize.query(query, { replacements: { eventId } });
    return result;
  } catch (error) {
    throw dbError(error, "Error fetching injury treatment records");
  }
}

/**
 * Every treatment logged for one casualty, newest first.
 */
async function get_injury_treatments_by_injury(injuryId) {
  const query =
    'SELECT * FROM "injuries-treatment" WHERE "injury-id" = :injuryId ORDER BY "recorded-at" DESC;';
  try {
    const [result] = await sequelize.query(query, { replacements: { injuryId } });
    return result;
  } catch (error) {
    throw dbError(error, "Error fetching injury treatment records");
  }
}

module.exports = {
  create_injury_treatment,
  update_injury_treatment,
  update_injury_treatment_by_id,
  delete_injury_treatment,
  delete_injury_treatment_by_id,
  get_injury_treatment_by_event,
  get_injury_treatments_by_event,
  get_injury_treatments_by_injury,
};