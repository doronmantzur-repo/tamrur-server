const casualtiesModel = require("../modules/casualtiesModel.js");

const URGENCY_VALUES = ["non-urgent", "urgent", "expectant", "deceased"];
// `walk` is retired and no longer accepted on write. The Postgres enum still
// contains it so rows written before this change stay readable; nothing can
// create or update a casualty with it any more.
const EVAC_ABILITY_VALUES = ["sit", "lie"];

/** The escort-type value meaning "no escort needed". */
const NO_ESCORT = "none";

function assertNumber(value, label) {
  if (value === undefined || value === null) return;

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw { status: 400, message: `${label} must be a number` };
  }
}

function assertBoolean(value, label) {
  if (value === undefined || value === null) return;

  if (typeof value !== "boolean") {
    throw { status: 400, message: `${label} must be a boolean` };
  }
}

function assertString(value, label) {
  if (value === undefined || value === null) return;

  if (typeof value !== "string") {
    throw { status: 400, message: `${label} must be a string` };
  }
}

function validateCasualtyFields(fields) {
  const {
    urgency,
    evacPriority,
    escort,
    evacAbility,
    evacReady,
    description,
    casualtyNumber,
    treatments,
    treatmentPriority,
    ventilation,
    escortType,
    helivac,
    isEvacuated,
    evacuatedAt,
  } = fields;

  if (urgency !== undefined && urgency !== null && !URGENCY_VALUES.includes(urgency)) {
    throw { status: 400, message: `urgency must be one of: ${URGENCY_VALUES.join(", ")}` };
  }

  if (
    evacAbility !== undefined &&
    evacAbility !== null &&
    !EVAC_ABILITY_VALUES.includes(evacAbility)
  ) {
    throw { status: 400, message: `evac-ability must be one of: ${EVAC_ABILITY_VALUES.join(", ")}` };
  }

  assertNumber(evacPriority, "evac-priority");
  assertNumber(treatmentPriority, "treatment-priority");
  assertNumber(casualtyNumber, "casualty-number");

  assertBoolean(escort, "escort");
  assertBoolean(evacReady, "evac-ready");
  assertBoolean(helivac, "helivac");
  assertBoolean(isEvacuated, "is_evacuated");

  if (evacuatedAt !== undefined && evacuatedAt !== null) {
    if (typeof evacuatedAt !== "string" || Number.isNaN(new Date(evacuatedAt).getTime())) {
      throw { status: 400, message: "evacuated_at must be an ISO 8601 timestamp string" };
    }
  }

  assertString(description, "description");
  assertString(ventilation, "ventilation");
  assertString(escortType, "escort-type");

  // Each treatment is free text the medic typed, plus whether it has actually
  // been given yet. Rows written before this carry a flat array of fixed keys;
  // those are still readable, but only the current shape is accepted on write.
  if (treatments !== undefined && treatments !== null) {
    const isEntry = (item) =>
      item !== null &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      typeof item.text === "string" &&
      typeof item.done === "boolean";

    if (!Array.isArray(treatments) || !treatments.every(isEntry)) {
      throw {
        status: 400,
        message: "treatments must be an array of { text: string, done: boolean }",
      };
    }
  }
}

/**
 * Reads the request body into the model's camelCase field names.
 *
 * The body uses this table's kebab-case column names, so only keys the caller
 * actually sent end up in the result — the model writes exactly those, and
 * leaves every other column alone.
 *
 * @param {Object} body - The request body.
 * @returns {Object} camelCase fields, with absent keys omitted entirely.
 */
function readCasualtyFields(body) {
  const mapping = {
    urgency: "urgency",
    "evac-priority": "evacPriority",
    escort: "escort",
    "recommended-evac-dest": "destEvacRecommend",
    "evac-ability": "evacAbility",
    "evac-ready": "evacReady",
    description: "description",
    "casualty-number": "casualtyNumber",
    treatments: "treatments",
    "treatment-priority": "treatmentPriority",
    ventilation: "ventilation",
    "escort-type": "escortType",
    helivac: "helivac",
    // Snake_case, matching the columns added for evacuation tracking — the medic
    // table sends each column under its own name.
    is_evacuated: "isEvacuated",
    evacuated_at: "evacuatedAt",
  };

  const fields = {};
  Object.entries(mapping).forEach(([bodyKey, fieldKey]) => {
    if (body[bodyKey] !== undefined) {
      fields[fieldKey] = body[bodyKey];
    }
  });

  // `escort` stays a plain boolean because the dashboard, brigade and airforce
  // tables all render it as a yes/no column. The medic form sets the richer
  // "escort-type", so mirror it across unless the caller set both explicitly.
  if (fields.escortType !== undefined && fields.escort === undefined) {
    fields.escort = Boolean(fields.escortType) && fields.escortType !== NO_ESCORT;
  }

  return fields;
}

async function create_casualty(req, res, next) {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      throw { status: 400, message: "eventId missing" };
    }

    const fields = readCasualtyFields(req.body);
    validateCasualtyFields(fields);

    const casualty = await casualtiesModel.create_casualty({ eventId, ...fields });
    res.status(201).json({ casualty });
  } catch (err) {
    next(err);
  }
}

async function update_casualty(req, res, next) {
  try {
    const { id } = req.params;
    const fields = readCasualtyFields(req.body);

    if (Object.keys(fields).length === 0) {
      throw { status: 400, message: "at least one field must be provided" };
    }

    validateCasualtyFields(fields);

    const casualty = await casualtiesModel.update_casualty(id, fields);
    res.status(200).json({ casualty });
  } catch (err) {
    next(err);
  }
}

async function get_casualties_by_event(req, res, next) {
  try {
    const { eventId } = req.params;
    const casualties = await casualtiesModel.get_casualties_by_event(eventId);
    res.status(200).json({ casualties });
  } catch (err) {
    next(err);
  }
}

module.exports = { create_casualty, update_casualty, get_casualties_by_event };
