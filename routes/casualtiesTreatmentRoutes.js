const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");
const { authorize } = require("../middlewares/authorize.js");

const {
  create_casualty_treatment,
  update_casualty_treatment,
  update_casualty_treatment_by_id,
  delete_casualty_treatment,
  delete_casualty_treatment_by_id,
  get_casualty_treatment_by_event,
  get_casualty_treatments_by_event,
  get_casualty_treatments_by_injury,
} = require("../controllers/casualtiesTreatmentController");

const router = express.Router();

router.post("/", authenticate, authorize("medic"), create_casualty_treatment);

// Two-segment paths first: the single-segment ":eventId" routes below would
// otherwise never be reached ambiguously, but keeping the specific ones on top
// makes the precedence obvious to anyone adding routes later.
router.get("/by-event/:eventId", authenticate, authorize("brigade", "medic", "supervisor"), get_casualty_treatments_by_event);
router.get("/by-injury/:injuryId", authenticate, authorize("brigade", "medic", "supervisor"), get_casualty_treatments_by_injury);
router.put("/record/:id", authenticate, authorize("medic"), update_casualty_treatment_by_id);
router.delete("/record/:id", authenticate, authorize("medic"), delete_casualty_treatment_by_id);

// Event-scoped routes, kept for the original single-record-per-event callers.
// They address *every* row belonging to the event, so prefer the /record and
// /by-* routes above for anything per-casualty.
router.put("/:eventId", authenticate, authorize("medic"), update_casualty_treatment);
router.delete("/:eventId", authenticate, authorize("medic"), delete_casualty_treatment);
router.get("/:eventId", authenticate, authorize("brigade", "medic", "supervisor"), get_casualty_treatment_by_event);

module.exports = router;
