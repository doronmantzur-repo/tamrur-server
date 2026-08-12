const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");

const {
  create_vitals,
  update_vitals,
  update_vitals_by_id,
  delete_vitals,
  delete_vitals_by_id,
  get_vitals_by_event,
  get_vitals_records_by_event,
  get_vitals_records_by_injury,
} = require("../controllers/vitalsController");

const router = express.Router();

router.post("/", authenticate, create_vitals);

// Two-segment paths first: the single-segment ":eventId" routes below would
// otherwise never be reached ambiguously, but keeping the specific ones on top
// makes the precedence obvious to anyone adding routes later.
router.get("/by-event/:eventId", authenticate, get_vitals_records_by_event);
router.get("/by-injury/:injuryId", authenticate, get_vitals_records_by_injury);
router.put("/record/:id", authenticate, update_vitals_by_id);
router.delete("/record/:id", authenticate, delete_vitals_by_id);

// Event-scoped routes, kept for the original single-record-per-event callers.
// They address *every* row belonging to the event, so prefer the /record and
// /by-* routes above for anything per-casualty.
router.put("/:eventId", authenticate, update_vitals);
router.delete("/:eventId", authenticate, delete_vitals);
router.get("/:eventId", authenticate, get_vitals_by_event);

module.exports = router;