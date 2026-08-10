const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");

const {
  create_injury_treatment,
  update_injury_treatment,
  delete_injury_treatment,
  get_injury_treatment_by_event,
} = require("../controllers/injuriesTreatmentController");

const router = express.Router();

router.post("/", authenticate, create_injury_treatment);
router.put("/:eventId", authenticate, update_injury_treatment);
router.delete("/:eventId", authenticate, delete_injury_treatment);
router.get("/:eventId", authenticate, get_injury_treatment_by_event);

module.exports = router;
