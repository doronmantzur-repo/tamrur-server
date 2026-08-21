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

// Scalar columns updated 1:1 by name (JS field -> DB column). `status` is
// deliberately absent — it's derived from startTime/concludedAt below rather
// than settable directly, so every caller that changes timing gets the
// right status for free instead of having to remember to set it themselves.
const SCALAR_COLUMNS = {
  method: "method",
  forceRadioSign: "force_radio_sign",
  startTime: "start_time",
  eta: "eta",
  concludedAt: "concluded_at",
  aerialMissionId: "aerial_mission_id",
};

// Geography columns need GeoJSON parsing when set, and can't go through the
// same replacement slot when cleared (ST_GeomFromGeoJSON has nothing to parse).
const GEOGRAPHY_COLUMNS = {
  departurePoint: "departure_point",
  destinationPoint: "destination_point",
};

/**
 * Builds an UPDATE's SET clause + replacements from only the fields actually
 * present in `updates` (i.e. `!== undefined` — a field the client never
 * mentioned, since JSON has no way to encode `undefined`, meaning the
 * controller's destructuring left it out). This is what lets a field be
 * explicitly cleared: COALESCE-ing every column against its old value
 * (the previous approach) can't distinguish "the client didn't send this
 * field" from "the client explicitly cleared it to empty" — both arrive as
 * SQL NULL, so COALESCE always falls back to the existing value either way.
 * Building the SET clause only from present keys, and writing a real NULL
 * for a present-but-falsy value, keeps both cases: an omitted field is
 * genuinely untouched (a true partial update, e.g. the start-now/finish
 * quick actions only ever send one or two fields), while an explicitly
 * cleared field actually becomes NULL.
 */
function buildEvacuationUpdate(updates) {
  const setClauses = [];
  const replacements = {};

  for (const [field, column] of Object.entries(SCALAR_COLUMNS)) {
    if (updates[field] === undefined) continue;
    setClauses.push(`${column} = :${field}`);
    replacements[field] = updates[field] || null;
  }

  for (const [field, column] of Object.entries(GEOGRAPHY_COLUMNS)) {
    if (updates[field] === undefined) continue;
    if (updates[field]) {
      setClauses.push(`${column} = ST_SetSRID(ST_GeomFromGeoJSON(:${field}), 4326)::geography`);
      replacements[field] = JSON.stringify(updates[field]);
    } else {
      setClauses.push(`${column} = NULL`);
    }
  }

  // Status tracks whichever of these two timing fields was actually
  // touched by this update — concludedAt wins if present (finishing
  // overrides everything else), otherwise startTime decides, otherwise
  // both are empty and the evacuation hasn't left yet. This covers every
  // real caller: start-now sends only startTime, finish sends only
  // concludedAt, and the edit modal always sends both (plus eta) together,
  // including as explicit nulls when the user clears a field — so clearing
  // a finish time correctly reverts status back to "started".
  if (updates.startTime !== undefined || updates.concludedAt !== undefined) {
    const status = updates.concludedAt ? "completed" : updates.startTime ? "started" : "not_started";
    setClauses.push("status = :status");
    replacements.status = status;
  }

  return { setClauses, replacements };
}

async function update_evacuation(id, updates) {
  const { setClauses, replacements } = buildEvacuationUpdate(updates);
  if (setClauses.length === 0) {
    throw { status: 400, message: "at least one field must be provided" };
  }

  const query = `UPDATE evacuations SET ${setClauses.join(", ")} WHERE id = :id RETURNING ${EVACUATION_COLUMNS};`;
  try {
    const [result] = await sequelize.query(query, { replacements: { ...replacements, id } });
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
