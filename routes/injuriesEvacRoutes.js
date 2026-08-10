const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");

const {
  create_injury_evac,
  update_injury_evac,
  get_injury_evac_by_event,
} = require("../controllers/injuriesEvacController");

const router = express.Router();

router.post("/", authenticate, create_injury_evac);
router.put("/:id", authenticate, update_injury_evac);
router.get("/:eventId", authenticate, get_injury_evac_by_event);

module.exports = router;
