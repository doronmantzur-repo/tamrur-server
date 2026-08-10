const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");

const {
  create_vitals,
  update_vitals,
  delete_vitals,
  get_vitals_by_event,
} = require("../controllers/vitalsController");

const router = express.Router();

router.post("/", authenticate, create_vitals);
router.put("/:eventId", authenticate, update_vitals);
router.delete("/:eventId", authenticate, delete_vitals);
router.get("/:eventId", authenticate, get_vitals_by_event);

module.exports = router;
