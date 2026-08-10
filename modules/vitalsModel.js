const { sequelize } = require("../db/models");

async function create_vitals(data) {
  const query =
    'INSERT INTO vitals ("event-id", "injury-id", pulse, "blood-pressure", spo2, "repiratory-rate", "oral-temperature", "rectal-temperature") VALUES (:eventId, :injuryId, :pulse, :bloodPressure, :spo2, :respiratoryRate, :oralTemperature, :rectalTemperature) RETURNING *;';
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
      },
    });
    return result[0];
  } catch (error) {
    throw new Error("Error creating vitals record");
  }
}

async function update_vitals(eventId, updates) {
  const query =
    'UPDATE vitals SET "injury-id" = COALESCE(:injuryId, "injury-id"), pulse = COALESCE(:pulse, pulse), "blood-pressure" = COALESCE(:bloodPressure, "blood-pressure"), spo2 = COALESCE(:spo2, spo2), "repiratory-rate" = COALESCE(:respiratoryRate, "repiratory-rate"), "oral-temperature" = COALESCE(:oralTemperature, "oral-temperature"), "rectal-temperature" = COALESCE(:rectalTemperature, "rectal-temperature") WHERE "event-id" = :eventId RETURNING *;';
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
      },
    });
    const record = result[0];
    if (!record) {
      throw { status: 404, message: "Vitals record not found" };
    }
    return record;
  } catch (error) {
    if (error.status) throw error;
    throw new Error("Error updating vitals record");
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
    if (error.status) throw error;
    throw new Error("Error deleting vitals record");
  }
}

async function get_vitals_by_event(eventId) {
  const query = 'SELECT * FROM vitals WHERE "event-id" = :eventId;';
  try {
    const [result] = await sequelize.query(query, { replacements: { eventId } });
    return result[0] ?? null;
  } catch (error) {
    throw new Error("Error fetching vitals record");
  }
}

module.exports = { create_vitals, update_vitals, delete_vitals, get_vitals_by_event };
