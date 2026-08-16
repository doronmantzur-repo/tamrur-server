const drugsModel = require("../modules/drugsModel.js");

const DOSE_UNITS = ["mcg", "mg", "g"];
const ROUTES = ["IV", "IM", "PO", "PR", "SC", "IO", "Inhalation"];

/**
 * Validates the writable fields, so a bad value comes back as a 400 with a
 * usable message rather than a CHECK-constraint violation surfacing as a 500.
 *
 * @param {Object} fields - camelCase fields.
 * @param {boolean} isCreate - Whether the required fields must all be present.
 * @returns {void}
 */
function validateDrugFields(fields, isCreate) {
  const { drugName, doseAmount, doseUnit, route, administeredAt } = fields;

  if (isCreate) {
    if (!drugName || typeof drugName !== "string" || !drugName.trim()) {
      throw { status: 400, message: "drugName is required" };
    }
    if (doseAmount === undefined || doseAmount === null) {
      throw { status: 400, message: "doseAmount is required" };
    }
    if (!doseUnit) throw { status: 400, message: "doseUnit is required" };
    if (!route) throw { status: 400, message: "route is required" };
  }

  if (drugName !== undefined && (typeof drugName !== "string" || !drugName.trim())) {
    throw { status: 400, message: "drugName must be a non-empty string" };
  }

  if (doseAmount !== undefined) {
    if (typeof doseAmount !== "number" || Number.isNaN(doseAmount)) {
      throw { status: 400, message: "doseAmount must be a number" };
    }
    if (doseAmount <= 0) {
      throw { status: 400, message: "doseAmount must be greater than 0" };
    }
  }

  if (doseUnit !== undefined && !DOSE_UNITS.includes(doseUnit)) {
    throw { status: 400, message: `doseUnit must be one of: ${DOSE_UNITS.join(", ")}` };
  }

  if (route !== undefined && !ROUTES.includes(route)) {
    throw { status: 400, message: `route must be one of: ${ROUTES.join(", ")}` };
  }

  if (administeredAt !== undefined && administeredAt !== null) {
    if (typeof administeredAt !== "string" || Number.isNaN(new Date(administeredAt).getTime())) {
      throw { status: 400, message: "administeredAt must be an ISO 8601 timestamp string" };
    }
  }
}

/**
 * Reads the writable fields off a request body, omitting absent keys so an
 * update writes only what it was given.
 */
function readDrugFields(body) {
  const fields = {};
  ["drugName", "doseAmount", "doseUnit", "route", "administeredAt"].forEach((key) => {
    if (body[key] !== undefined) fields[key] = body[key];
  });
  return fields;
}

async function create_drug(req, res, next) {
  try {
    const { eventId, casualtyId } = req.body;

    if (!eventId) throw { status: 400, message: "eventId missing" };
    if (!casualtyId) throw { status: 400, message: "casualtyId missing" };

    const fields = readDrugFields(req.body);
    validateDrugFields(fields, true);

    const drug = await drugsModel.create_drug({ eventId, casualtyId, ...fields });
    res.status(201).json({ drug });
  } catch (err) {
    next(err);
  }
}

async function update_drug(req, res, next) {
  try {
    const { id } = req.params;
    const fields = readDrugFields(req.body);

    if (Object.keys(fields).length === 0) {
      throw { status: 400, message: "at least one field must be provided" };
    }

    validateDrugFields(fields, false);

    const drug = await drugsModel.update_drug(id, fields);
    res.status(200).json({ drug });
  } catch (err) {
    next(err);
  }
}

async function delete_drug(req, res, next) {
  try {
    const drug = await drugsModel.delete_drug(req.params.id);
    res.status(200).json({ drug });
  } catch (err) {
    next(err);
  }
}

async function get_drugs_by_event(req, res, next) {
  try {
    const drugs = await drugsModel.get_drugs_by_event(req.params.eventId);
    res.status(200).json({ drugs });
  } catch (err) {
    next(err);
  }
}

async function get_drugs_by_casualty(req, res, next) {
  try {
    const drugs = await drugsModel.get_drugs_by_casualty(req.params.casualtyId);
    res.status(200).json({ drugs });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create_drug,
  update_drug,
  delete_drug,
  get_drugs_by_event,
  get_drugs_by_casualty,
};
