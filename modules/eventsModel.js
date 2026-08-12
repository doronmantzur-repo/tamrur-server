const { sequelize } = require("../db/models");

async function create_event(eventData) {
  const query =
    "INSERT INTO events (name, type, location, status) VALUES (:name, :type, ST_SetSRID(ST_GeomFromGeoJSON(:location), 4326)::geography, 'evaluated') RETURNING *;";
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
    "SELECT id, name, type, status, ST_AsGeoJSON(location)::json AS location, created_at, closure_at, \"aerial-evac\" FROM events ORDER BY created_at DESC;";
  try {
    const [result] = await sequelize.query(query);
    return result;
  } catch (error) {
    throw new Error("Error fetching events");
  }
}

async function get_event_by_id(id) {
  const query =
    "SELECT id, name, type, status, ST_AsGeoJSON(location)::json AS location, created_at, closure_at, \"aerial-evac\" FROM events WHERE id = :id;";
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
    "UPDATE events SET name = COALESCE(:name, name), status = COALESCE(:status, status), closure_at = COALESCE(:closure_at, closure_at), type = COALESCE(:type, type), location = COALESCE(ST_SetSRID(ST_GeomFromGeoJSON(:location), 4326)::geography, location) WHERE id = :id RETURNING *;";
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        id,
        name: updates.name ?? null,
        status: updates.status ?? null,
        closure_at: updates.closure_at ?? null,
        type: updates.type ?? null,
        location: updates.location ? JSON.stringify(updates.location) : null,
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

module.exports = { create_event, list_events, get_event_by_id, update_event };
