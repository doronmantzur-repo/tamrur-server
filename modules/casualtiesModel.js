const { sequelize } = require("../db/models");

/**
 * Logs the underlying Postgres error, then returns the caller-facing one.
 *
 * Without this the real cause (a missing column, a constraint violation) is
 * discarded and the client just sees an opaque 500 with nothing written down
 * anywhere. Errors that already carry a status pass through untouched.
 */
function dbError(error, message) {
  if (error?.status) return error;

  console.error(message, error);
  return new Error(message);
}

/**
 * The writable columns, keyed by the camelCase name the controller passes in.
 *
 * Statements are assembled from this map alone — never from caller-supplied
 * strings — so an unknown key is dropped rather than reaching the SQL.
 */
const COLUMNS = {
  urgency: '"urgency"',
  evacPriority: '"evac-priority"',
  escort: '"escort"',
  destEvacRecommend: '"recommended-evac-dest"',
  evacAbility: '"evac-ability"',
  evacReady: '"evac-ready"',
  description: '"description"',
  casualtyNumber: '"casualty-number"',
  treatments: '"treatments"',
  treatmentPriority: '"treatment-priority"',
  ventilation: '"ventilation"',
  escortType: '"escort-type"',
  helivac: '"helivac"',
  isEvacuated: '"is_evacuated"',
  evacuatedAt: '"evacuated_at"',
};

/** Columns holding JSON, which need an explicit cast on the bind parameter. */
const JSON_COLUMNS = new Set(["treatments"]);

/**
 * Stamps `evacuated_at` alongside a change to `is_evacuated`.
 *
 * The medic just ticks a box; the moment of evacuation is the server's to
 * record. An explicit `evacuatedAt` from the caller always wins, so a correction
 * can still be entered by hand.
 *
 * @param {Object} fields - camelCase fields about to be written.
 * @returns {Object} The same fields, with `evacuatedAt` filled in when implied.
 */
function withEvacuationTimestamp(fields) {
  if (fields.isEvacuated === undefined || fields.evacuatedAt !== undefined) {
    return fields;
  }

  return {
    ...fields,
    evacuatedAt: fields.isEvacuated ? new Date().toISOString() : null,
  };
}

/**
 * Turns the provided fields into `column = :param` fragments plus their binds.
 *
 * Only keys actually present are included. That's the point: a COALESCE-every-
 * column update can never clear a value, so unchecking a treatment or clearing
 * a note would silently keep the old one — and the medic table edits one cell
 * at a time.
 *
 * @param {Object} fields - camelCase field name -> value. `undefined` is skipped, `null` clears.
 * @returns {{assignments: Array<string>, replacements: Object}}
 */
function buildAssignments(fields) {
  const assignments = [];
  const replacements = {};

  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined) return;

    const column = COLUMNS[key];
    if (!column) return;

    const isJson = JSON_COLUMNS.has(key);
    assignments.push(`${column} = :${key}${isJson ? "::jsonb" : ""}`);
    replacements[key] = isJson && value !== null ? JSON.stringify(value) : value;
  });

  return { assignments, replacements };
}

/**
 * Inserts a casualty.
 *
 * Columns the caller left out keep their schema defaults (`treatments` an empty
 * array, `helivac` false) rather than being forced to null.
 */
async function create_casualty(casualtyData) {
  const { eventId, ...rest } = casualtyData;
  const fields = withEvacuationTimestamp(rest);
  const columns = ['"event-id"'];
  const values = [":eventId"];
  const replacements = { eventId };

  // מס' פצוע is handed out automatically unless the medic typed one. A blank
  // field arrives as an explicit null rather than an absent key, so both have
  // to count as "not provided" — otherwise every casualty is created unnumbered.
  const assignCasualtyNumber =
    fields.casualtyNumber === undefined || fields.casualtyNumber === null;
  if (assignCasualtyNumber) {
    delete fields.casualtyNumber;
  }

  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined) return;

    const column = COLUMNS[key];
    if (!column) return;

    const isJson = JSON_COLUMNS.has(key);
    columns.push(column);
    values.push(`:${key}${isJson ? "::jsonb" : ""}`);
    replacements[key] = isJson && value !== null ? JSON.stringify(value) : value;
  });

  // The next number for this event, counted in the same statement as the
  // insert. Two simultaneous inserts can still pick the same number; the field
  // is editable, and a duplicate is a lot less disruptive mid-incident than a
  // failed insert would be.
  if (assignCasualtyNumber) {
    columns.push('"casualty-number"');
    values.push(
      '(SELECT COALESCE(MAX("casualty-number"), 0) + 1 FROM casualties WHERE "event-id" = :eventId)',
    );
  }

  const query = `INSERT INTO casualties (${columns.join(", ")}) VALUES (${values.join(", ")}) RETURNING *;`;

  try {
    const [result] = await sequelize.query(query, { replacements });
    return result[0];
  } catch (error) {
    throw dbError(error, "Error creating casualty record");
  }
}

/**
 * Updates a casualty, writing only the fields the caller actually sent.
 */
async function update_casualty(id, updates) {
  const { assignments, replacements } = buildAssignments(withEvacuationTimestamp(updates));

  if (assignments.length === 0) {
    throw { status: 400, message: "at least one field must be provided" };
  }

  const query = `UPDATE casualties SET ${assignments.join(", ")} WHERE id = :id RETURNING *;`;

  try {
    const [result] = await sequelize.query(query, { replacements: { ...replacements, id } });
    const casualty = result[0];
    if (!casualty) {
      throw { status: 404, message: "Casualty not found" };
    }
    return casualty;
  } catch (error) {
    throw dbError(error, "Error updating casualty");
  }
}

/**
 * An event's casualties, in the order the paper form lists them.
 */
async function get_casualties_by_event(eventId) {
  const query =
    'SELECT * FROM casualties WHERE "event-id" = :eventId ORDER BY "casualty-number" ASC NULLS LAST, created_at ASC;';
  try {
    const [result] = await sequelize.query(query, {
      replacements: { eventId },
    });
    return result;
  } catch (error) {
    throw dbError(error, "Error fetching casualties");
  }
}

module.exports = { create_casualty, update_casualty, get_casualties_by_event };
