const { sequelize } = require("../db/models");

async function create_injury(injuryData) {
  const query =
    'INSERT INTO injuries ("event-id", urgency) VALUES (:eventId, :urgency) RETURNING *;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: { eventId: injuryData.eventId, urgency: injuryData.urgency ?? null },
    });
    return result[0];
  } catch (error) {
    throw new Error("Error creating injury record");
  }
}

async function update_injury(id, updates) {
  const query =
    'UPDATE injuries SET urgency = COALESCE(:urgency, urgency), escort = COALESCE(:escort, escort), "recommended-evac-dest" = COALESCE(:destEvacRecommend, "recommended-evac-dest"), "evac-abillity" = COALESCE(:evacAbility, "evac-abillity"), "evac-ready" = COALESCE(:evacReady, "evac-ready") WHERE id = :id RETURNING *;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        id,
        urgency: updates.urgency ?? null,
        escort: updates.escort ?? null,
        destEvacRecommend: updates.destEvacRecommend ?? null,
        evacAbility: updates.evacAbility ?? null,
        evacReady: updates.evacReady ?? null,
      },
    });
    const injury = result[0];
    if (!injury) {
      throw { status: 404, message: "Injury not found" };
    }
    return injury;
  } catch (error) {
    if (error.status) throw error;
    throw new Error("Error updating injury");
  }
}

async function get_injuries_by_event(eventId) {
  const query = 'SELECT * FROM injuries WHERE "event-id" = :eventId;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: { eventId },
    });
    return result;
  } catch (error) {
    throw new Error("Error fetching injuries");
  }
}

module.exports = { create_injury, update_injury, get_injuries_by_event };
