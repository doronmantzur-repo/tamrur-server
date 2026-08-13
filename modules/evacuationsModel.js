const { sequelize } = require("../db/models");

async function create_evacuation(evacuationData) {
  const query =
    'INSERT INTO evacuations ("event-id", method, departure_point, force_radio_sign, start_time, eta, aerial_mission_id, destination_point, status) VALUES (:eventId, :method, ST_SetSRID(ST_GeomFromGeoJSON(:departurePoint), 4326)::geography, :forceRadioSign, :startTime, :eta, :aerialMissionId, ST_SetSRID(ST_GeomFromGeoJSON(:destinationPoint), 4326)::geography, \'not_started\') RETURNING *;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        eventId: evacuationData.eventId,
        method: evacuationData.method ?? null,
        departurePoint: evacuationData.departurePoint ? JSON.stringify(evacuationData.departurePoint) : null,
        forceRadioSign: evacuationData.forceRadioSign ?? null,
        startTime: evacuationData.startTime ?? null,
        eta: evacuationData.eta ?? null,
        aerialMissionId: evacuationData.aerialMissionId ?? null,
        destinationPoint: evacuationData.destinationPoint ? JSON.stringify(evacuationData.destinationPoint) : null,
      },
    });
    return result[0];
  } catch (error) {
    throw new Error("Error creating evacuation record");
  }
}

async function update_evacuation(id, updates) {
  const query =
    'UPDATE evacuations SET method = COALESCE(:method, method), departure_point = COALESCE(ST_SetSRID(ST_GeomFromGeoJSON(:departurePoint), 4326)::geography, departure_point), force_radio_sign = COALESCE(:forceRadioSign, force_radio_sign), status = COALESCE(:status, status), start_time = COALESCE(:startTime, start_time), eta = COALESCE(:eta, eta), concluded_at = COALESCE(:concludedAt, concluded_at), aerial_mission_id = COALESCE(:aerialMissionId, aerial_mission_id), destination_point = COALESCE(ST_SetSRID(ST_GeomFromGeoJSON(:destinationPoint), 4326)::geography, destination_point) WHERE id = :id RETURNING *;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        id,
        method: updates.method ?? null,
        departurePoint: updates.departurePoint ? JSON.stringify(updates.departurePoint) : null,
        forceRadioSign: updates.forceRadioSign ?? null,
        status: updates.status ?? null,
        startTime: updates.startTime ?? null,
        eta: updates.eta ?? null,
        concludedAt: updates.concludedAt ?? null,
        aerialMissionId: updates.aerialMissionId ?? null,
        destinationPoint: updates.destinationPoint ? JSON.stringify(updates.destinationPoint) : null,
      },
    });
    const evacuation = result[0];
    if (!evacuation) {
      throw { status: 404, message: "Evacuation not found" };
    }
    return evacuation;
  } catch (error) {
    if (error.status) throw error;
    throw new Error("Error updating evacuation");
  }
}

async function get_evacuations_by_event(eventId) {
  const query = 'SELECT * FROM evacuations WHERE "event-id" = :eventId ORDER BY created_at DESC;';
  try {
    const [result] = await sequelize.query(query, { replacements: { eventId } });
    return result;
  } catch (error) {
    throw new Error("Error fetching evacuations");
  }
}

async function delete_evacuation(id) {
  const query = "DELETE FROM evacuations WHERE id = :id RETURNING *;";
  try {
    const [result] = await sequelize.query(query, { replacements: { id } });
    const evacuation = result[0];
    if (!evacuation) {
      throw { status: 404, message: "Evacuation not found" };
    }
    return evacuation;
  } catch (error) {
    if (error.status) throw error;
    throw new Error("Error deleting evacuation");
  }
}

module.exports = {
  create_evacuation,
  update_evacuation,
  get_evacuations_by_event,
  delete_evacuation,
};
