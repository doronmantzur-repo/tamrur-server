const { sequelize } = require("../db/models");

// departure_point/destination_point are PostGIS geography columns — RETURNING/SELECT
// them raw comes back as WKB, not GeoJSON, so every query here converts them via
// ST_AsGeoJSON (same as events.location in eventsModel.js) and aliases back to the
// camelCase names the client already sends in request bodies. Every other column
// keeps its real DB name (snake_case) — the app's established convention is
// camelCase in, DB-native names out (see events.gathering_status/evac_status).
const EVACUATION_COLUMNS = `id, "event-id", created_at, method, ST_AsGeoJSON(departure_point)::json AS "departurePoint", force_radio_sign, status, start_time, eta, concluded_at, aerial_mission_id, ST_AsGeoJSON(destination_point)::json AS "destinationPoint"`;

async function create_evacuation(evacuationData) {
  const query =
    `INSERT INTO evacuations ("event-id", method, departure_point, force_radio_sign, start_time, eta, aerial_mission_id, destination_point, status) VALUES (:eventId, :method, ST_SetSRID(ST_GeomFromGeoJSON(:departurePoint), 4326)::geography, :forceRadioSign, :startTime, :eta, :aerialMissionId, ST_SetSRID(ST_GeomFromGeoJSON(:destinationPoint), 4326)::geography, 'not_started') RETURNING ${EVACUATION_COLUMNS};`;
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
    `UPDATE evacuations SET method = COALESCE(:method, method), departure_point = COALESCE(ST_SetSRID(ST_GeomFromGeoJSON(:departurePoint), 4326)::geography, departure_point), force_radio_sign = COALESCE(:forceRadioSign, force_radio_sign), status = COALESCE(:status, status), start_time = COALESCE(:startTime, start_time), eta = COALESCE(:eta, eta), concluded_at = COALESCE(:concludedAt, concluded_at), aerial_mission_id = COALESCE(:aerialMissionId, aerial_mission_id), destination_point = COALESCE(ST_SetSRID(ST_GeomFromGeoJSON(:destinationPoint), 4326)::geography, destination_point) WHERE id = :id RETURNING ${EVACUATION_COLUMNS};`;
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

/**
 * Ensures exactly one evacuation row exists for an approved aerial mission —
 * creates it if missing, otherwise returns the row that's already there.
 * Atomic via the partial unique index on (aerial_mission_id) WHERE NOT NULL:
 * the INSERT either wins or hits that constraint and is silently skipped
 * (ON CONFLICT DO NOTHING), so two near-simultaneous approval requests for
 * the same mission can never both create a row — whichever loses the race
 * just reads back the winner's row instead. Replaces the old approach of
 * having each connected client poll-and-create client-side, which had no
 * way to coordinate across multiple browser tabs/sessions.
 */
async function ensure_aerial_evacuation({ eventId, aerialMissionId, forceRadioSign, departurePoint }) {
  const insertQuery = `
    INSERT INTO evacuations ("event-id", method, departure_point, force_radio_sign, aerial_mission_id, status)
    VALUES (:eventId, 'aerial', ST_SetSRID(ST_GeomFromGeoJSON(:departurePoint), 4326)::geography, :forceRadioSign, :aerialMissionId, 'not_started')
    ON CONFLICT (aerial_mission_id) WHERE aerial_mission_id IS NOT NULL DO NOTHING
    RETURNING ${EVACUATION_COLUMNS};
  `;
  try {
    const [inserted] = await sequelize.query(insertQuery, {
      replacements: {
        eventId,
        departurePoint: departurePoint ? JSON.stringify(departurePoint) : null,
        forceRadioSign: forceRadioSign ?? null,
        aerialMissionId,
      },
    });
    if (inserted[0]) return inserted[0];

    const [existing] = await sequelize.query(
      `SELECT ${EVACUATION_COLUMNS} FROM evacuations WHERE aerial_mission_id = :aerialMissionId LIMIT 1;`,
      { replacements: { aerialMissionId } },
    );
    return existing[0] ?? null;
  } catch (error) {
    throw new Error("Error ensuring aerial evacuation record");
  }
}

async function get_evacuations_by_event(eventId) {
  const query = `SELECT ${EVACUATION_COLUMNS} FROM evacuations WHERE "event-id" = :eventId ORDER BY created_at DESC;`;
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
  ensure_aerial_evacuation,
  get_evacuations_by_event,
  delete_evacuation,
};
