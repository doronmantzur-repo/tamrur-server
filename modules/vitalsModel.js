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

async function create_vitals(data) {
  const query =
    'INSERT INTO vitals ("event-id", "injury-id", pulse, "blood-pressure", spo2, "repiratory-rate", "oral-temperature", "rectal-temperature", "recorded-at") VALUES (:eventId, :injuryId, :pulse, :bloodPressure, :spo2, :respiratoryRate, :oralTemperature, :rectalTemperature, COALESCE(:recordedAt, now())) RETURNING *;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        eventId: data.eventId,
        injuryId: data.injuryId ?? null,
        pulse: data.pulse ?? null,
        bloodPressure: data.bloodPressure ? JSON.stringify(data.bloodPressure) : null,
        spo2: data.spo2 ?? null,
        respiratoryRate: data.respiratoryRate ?? null,
        oralTemperature: data.oralTemperature ?? null,
        rectalTemperature: data.rectalTemperature ?? null,
        recordedAt: data.recordedAt ?? null,
      },
    });
    return result[0];
  } catch (error) {
    throw dbError(error, "Error creating vitals record");
  }
}

async function update_vitals(eventId, updates) {
  const query =
    'UPDATE vitals SET "injury-id" = COALESCE(:injuryId, "injury-id"), pulse = COALESCE(:pulse, pulse), "blood-pressure" = COALESCE(:bloodPressure, "blood-pressure"), spo2 = COALESCE(:spo2, spo2), "repiratory-rate" = COALESCE(:respiratoryRate, "repiratory-rate"), "oral-temperature" = COALESCE(:oralTemperature, "oral-temperature"), "rectal-temperature" = COALESCE(:rectalTemperature, "rectal-temperature"), "recorded-at" = COALESCE(:recordedAt, "recorded-at") WHERE "event-id" = :eventId RETURNING *;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        eventId,
        injuryId: updates.injuryId ?? null,
        pulse: updates.pulse ?? null,
        bloodPressure: updates.bloodPressure ? JSON.stringify(updates.bloodPressure) : null,
        spo2: updates.spo2 ?? null,
        respiratoryRate: updates.respiratoryRate ?? null,
        oralTemperature: updates.oralTemperature ?? null,
        rectalTemperature: updates.rectalTemperature ?? null,
        recordedAt: updates.recordedAt ?? null,
      },
    });
    const record = result[0];
    if (!record) {
      throw { status: 404, message: "Vitals record not found" };
    }
    return record;
  } catch (error) {
    throw dbError(error, "Error updating vitals record");
  }
}

/**
 * Updates one vitals row by its own primary key.
 *
 * The event-scoped update above rewrites every row belonging to the event,
 * which is wrong once a casualty has more than one reading logged — the medic
 * interface addresses readings individually through this instead.
 */
async function update_vitals_by_id(id, updates) {
  const query =
    'UPDATE vitals SET "injury-id" = COALESCE(:injuryId, "injury-id"), pulse = COALESCE(:pulse, pulse), "blood-pressure" = COALESCE(:bloodPressure, "blood-pressure"), spo2 = COALESCE(:spo2, spo2), "repiratory-rate" = COALESCE(:respiratoryRate, "repiratory-rate"), "oral-temperature" = COALESCE(:oralTemperature, "oral-temperature"), "rectal-temperature" = COALESCE(:rectalTemperature, "rectal-temperature"), "recorded-at" = COALESCE(:recordedAt, "recorded-at") WHERE id = :id RETURNING *;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        id,
        injuryId: updates.injuryId ?? null,
        pulse: updates.pulse ?? null,
        bloodPressure: updates.bloodPressure ? JSON.stringify(updates.bloodPressure) : null,
        spo2: updates.spo2 ?? null,
        respiratoryRate: updates.respiratoryRate ?? null,
        oralTemperature: updates.oralTemperature ?? null,
        rectalTemperature: updates.rectalTemperature ?? null,
        recordedAt: updates.recordedAt ?? null,
      },
    });
    const record = result[0];
    if (!record) {
      throw { status: 404, message: "Vitals record not found" };
    }
    return record;
  } catch (error) {
    throw dbError(error, "Error updating vitals record");
  }
}

async function delete_vitals(eventId) {
  const query = 'DELETE FROM vitals WHERE "event-id" = :eventId RETURNING *;';
  try {
    const [result] = await sequelize.query(query, { replacements: { eventId } });
    const record = result[0];
    if (!record) {
      throw { status: 404, message: "Vitals record not found" };
    }
    return record;
  } catch (error) {
    throw dbError(error, "Error deleting vitals record");
  }
}

/**
 * Deletes one vitals row by its own primary key, leaving the casualty's other
 * readings untouched.
 */
async function delete_vitals_by_id(id) {
  const query = "DELETE FROM vitals WHERE id = :id RETURNING *;";
  try {
    const [result] = await sequelize.query(query, { replacements: { id } });
    const record = result[0];
    if (!record) {
      throw { status: 404, message: "Vitals record not found" };
    }
    return record;
  } catch (error) {
    throw dbError(error, "Error deleting vitals record");
  }
}

async function get_vitals_by_event(eventId) {
  const query = 'SELECT * FROM vitals WHERE "event-id" = :eventId;';
  try {
    const [result] = await sequelize.query(query, { replacements: { eventId } });
    return result[0] ?? null;
  } catch (error) {
    throw dbError(error, "Error fetching vitals record");
  }
}

/**
 * Every vitals reading logged across an event, newest first.
 *
 * The medic interface shows a whole event's casualties at once, so it pulls
 * the event's readings in one request and groups them by "injury-id"
 * client-side rather than issuing one request per casualty.
 */
async function get_vitals_records_by_event(eventId) {
  const query = 'SELECT * FROM vitals WHERE "event-id" = :eventId ORDER BY "recorded-at" DESC;';
  try {
    const [result] = await sequelize.query(query, { replacements: { eventId } });
    return result;
  } catch (error) {
    throw dbError(error, "Error fetching vitals records");
  }
}

/**
 * Every vitals reading logged for one casualty, newest first.
 */
async function get_vitals_records_by_injury(injuryId) {
  const query = 'SELECT * FROM vitals WHERE "injury-id" = :injuryId ORDER BY "recorded-at" DESC;';
  try {
    const [result] = await sequelize.query(query, { replacements: { injuryId } });
    return result;
  } catch (error) {
    throw dbError(error, "Error fetching vitals records");
  }
}

module.exports = {
  create_vitals,
  update_vitals,
  update_vitals_by_id,
  delete_vitals,
  delete_vitals_by_id,
  get_vitals_by_event,
  get_vitals_records_by_event,
  get_vitals_records_by_injury,
};