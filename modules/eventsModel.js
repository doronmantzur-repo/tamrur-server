const { sequelize } = require("../db/models");

async function create_event(eventData) {
  const query =
    "INSERT INTO events (name, type, location) VALUES (:name, :type, ST_SetSRID(ST_GeomFromGeoJSON(:location), 4326)::geography) RETURNING *;";
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        name: eventData.name ?? null,
        type: eventData.type,
        location: JSON.stringify(eventData.location),
      },
    });
    return result[0];
  } catch (error) {
    throw new Error("Error creating event");
  }
}

async function list_events() {
  const query =
    "SELECT id, name, type, status, ST_AsGeoJSON(location)::json AS location, created_at, closure_at, \"aerial-evac\", gathering_status, evac_status FROM events ORDER BY created_at DESC;";
  try {
    const [result] = await sequelize.query(query);
    return result;
  } catch (error) {
    throw new Error("Error fetching events");
  }
}

async function get_event_by_id(id) {
  const query =
    "SELECT id, name, type, status, ST_AsGeoJSON(location)::json AS location, created_at, closure_at, \"aerial-evac\", gathering_status, evac_status FROM events WHERE id = :id;";
  try {
    const [result] = await sequelize.query(query, {
      replacements: { id },
    });
    const event = result[0];
    if (!event) {
      throw { status: 404, message: "Event not found" };
    }
    return event;
  } catch (error) {
    if (error.status) throw error;
    throw new Error("Error fetching event");
  }
}

async function update_event(id, updates) {
  const query =
    'UPDATE events SET name = COALESCE(:name, name), type = COALESCE(:type, type), location = COALESCE(ST_SetSRID(ST_GeomFromGeoJSON(:location), 4326)::geography, location), "aerial-evac" = COALESCE(:aerialEvac, "aerial-evac"), gathering_status = COALESCE(:gatheringStatus, gathering_status) WHERE id = :id RETURNING *;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        id,
        name: updates.name ?? null,
        type: updates.type ?? null,
        location: updates.location ? JSON.stringify(updates.location) : null,
        aerialEvac: updates.aerialEvac ?? null,
        gatheringStatus: updates.gatheringStatus ?? null,
      },
    });
    const event = result[0];
    if (!event) {
      throw { status: 404, message: "Event not found" };
    }
    return event;
  } catch (error) {
    if (error.status) throw error;
    throw new Error("Error updating event");
  }
}

// One-way transition: only succeeds while the event's derived status is
// full_evacuation, and closure_at is stamped here rather than accepted from
// the client (see recalc_event_evac_status / db/migrations/007_event_status_enum.sql
// for why status can't just be set to 'closed' via the generic update above).
async function close_event(id) {
  const query =
    "UPDATE events SET status = 'closed', closure_at = now() WHERE id = :id AND status = 'full_evacuation' RETURNING *;";
  try {
    const [result] = await sequelize.query(query, {
      replacements: { id },
    });
    if (result[0]) return result[0];

    // Either the id doesn't exist, or it does but status isn't full_evacuation
    // — distinguish them so the controller can return 404 vs 409.
    await get_event_by_id(id); // throws 404 if missing
    throw { status: 409, message: "Event must be in full_evacuation status to close" };
  } catch (error) {
    if (error.status) throw error;
    throw new Error("Error closing event");
  }
}

module.exports = { create_event, list_events, get_event_by_id, update_event, close_event };
