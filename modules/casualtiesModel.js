const { sequelize } = require("../db/models");

async function create_casualty(casualtyData) {
  const query =
    'INSERT INTO casualties ("event-id", urgency, "evac-priority", escort, "recommended-evac-dest", "evac-ability", "evac-ready") VALUES (:eventId, :urgency, :evacPriority, :escort, :destEvacRecommend, :evacAbility, :evacReady) RETURNING *;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        eventId: casualtyData.eventId,
        urgency: casualtyData.urgency ?? null,
        evacPriority: casualtyData.evacPriority ?? null,
        escort: casualtyData.escort ?? null,
        destEvacRecommend: casualtyData.destEvacRecommend ?? null,
        evacAbility: casualtyData.evacAbility ?? null,
        evacReady: casualtyData.evacReady ?? null,
      },
    });
    return result[0];
  } catch (error) {
    throw new Error("Error creating casualty record");
  }
}

async function update_casualty(id, updates) {
  const query =
    'UPDATE casualties SET urgency = COALESCE(:urgency, urgency), "evac-priority" = COALESCE(:evacPriority, "evac-priority"), escort = COALESCE(:escort, escort), "recommended-evac-dest" = COALESCE(:destEvacRecommend, "recommended-evac-dest"), "evac-ability" = COALESCE(:evacAbility, "evac-ability"), "evac-ready" = COALESCE(:evacReady, "evac-ready") WHERE id = :id RETURNING *;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        id,
        urgency: updates.urgency ?? null,
        evacPriority: updates.evacPriority ?? null,
        escort: updates.escort ?? null,
        destEvacRecommend: updates.destEvacRecommend ?? null,
        evacAbility: updates.evacAbility ?? null,
        evacReady: updates.evacReady ?? null,
      },
    });
    const casualty = result[0];
    if (!casualty) {
      throw { status: 404, message: "Casualty not found" };
    }
    return casualty;
  } catch (error) {
    if (error.status) throw error;
    throw new Error("Error updating casualty");
  }
}

async function get_casualties_by_event(eventId) {
  const query = 'SELECT * FROM casualties WHERE "event-id" = :eventId;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: { eventId },
    });
    return result;
  } catch (error) {
    throw new Error("Error fetching casualties");
  }
}

module.exports = { create_casualty, update_casualty, get_casualties_by_event };
