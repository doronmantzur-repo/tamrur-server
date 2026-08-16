const { sequelize } = require("../db/models");

/**
 * Logs the underlying Postgres error, then returns the caller-facing one.
 *
 * Without this the real cause (a CHECK violation, a bad foreign key) is
 * discarded and the client just sees an opaque 500. Errors that already carry a
 * status pass through untouched.
 */
function dbError(error, message) {
  if (error?.status) return error;

  console.error(message, error);
  return new Error(message);
}

/** Columns a caller may write, keyed by the camelCase name the controller passes in. */
const COLUMNS = {
  drugName: "drug_name",
  doseAmount: "dose_amount",
  doseUnit: "dose_unit",
  route: "route",
  administeredAt: "administered_at",
};

/**
 * Records a drug administration.
 *
 * `administered_at` falls back to the column default rather than being forced
 * to null, so an omitted timestamp means "now" the same way it does for the
 * treatment and vitals logs.
 */
async function create_drug(data) {
  const query = `
    INSERT INTO drugs (casualty_id, event_id, drug_name, dose_amount, dose_unit, route, administered_at)
    VALUES (:casualtyId, :eventId, :drugName, :doseAmount, :doseUnit, :route, COALESCE(:administeredAt, now()))
    RETURNING *;`;

  try {
    const [result] = await sequelize.query(query, {
      replacements: {
        casualtyId: data.casualtyId,
        eventId: data.eventId,
        drugName: data.drugName,
        doseAmount: data.doseAmount,
        doseUnit: data.doseUnit,
        route: data.route,
        administeredAt: data.administeredAt ?? null,
      },
    });
    return result[0];
  } catch (error) {
    throw dbError(error, "Error creating drug record");
  }
}

/**
 * Updates one drug row, writing only the fields the caller actually sent.
 */
async function update_drug(id, updates) {
  const assignments = [];
  const replacements = { id };

  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined) return;

    const column = COLUMNS[key];
    if (!column) return;

    assignments.push(`${column} = :${key}`);
    replacements[key] = value;
  });

  if (assignments.length === 0) {
    throw { status: 400, message: "at least one field must be provided" };
  }

  const query = `UPDATE drugs SET ${assignments.join(", ")} WHERE id = :id RETURNING *;`;

  try {
    const [result] = await sequelize.query(query, { replacements });
    const drug = result[0];
    if (!drug) {
      throw { status: 404, message: "Drug record not found" };
    }
    return drug;
  } catch (error) {
    throw dbError(error, "Error updating drug record");
  }
}

async function delete_drug(id) {
  try {
    const [result] = await sequelize.query("DELETE FROM drugs WHERE id = :id RETURNING *;", {
      replacements: { id },
    });
    const drug = result[0];
    if (!drug) {
      throw { status: 404, message: "Drug record not found" };
    }
    return drug;
  } catch (error) {
    throw dbError(error, "Error deleting drug record");
  }
}

/**
 * Every drug logged across an event, newest first.
 *
 * The medic interface shows a whole event's casualties at once, so it pulls the
 * event's drugs in one request and groups them by casualty client-side rather
 * than issuing one request per casualty.
 */
async function get_drugs_by_event(eventId) {
  try {
    const [result] = await sequelize.query(
      "SELECT * FROM drugs WHERE event_id = :eventId ORDER BY administered_at DESC;",
      { replacements: { eventId } },
    );
    return result;
  } catch (error) {
    throw dbError(error, "Error fetching drug records");
  }
}

/**
 * Every drug logged for one casualty, newest first.
 */
async function get_drugs_by_casualty(casualtyId) {
  try {
    const [result] = await sequelize.query(
      "SELECT * FROM drugs WHERE casualty_id = :casualtyId ORDER BY administered_at DESC;",
      { replacements: { casualtyId } },
    );
    return result;
  } catch (error) {
    throw dbError(error, "Error fetching drug records");
  }
}

module.exports = {
  create_drug,
  update_drug,
  delete_drug,
  get_drugs_by_event,
  get_drugs_by_casualty,
};
