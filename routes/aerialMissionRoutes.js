const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");

const {
  create_aerial_mission,
  update_aerial_mission,
  get_aerial_missions_by_event,
} = require("../controllers/aerialMissionController");

const router = express.Router();

router.post("/", authenticate, create_aerial_mission);
router.put("/:id", authenticate, update_aerial_mission);
router.get("/:eventId", authenticate, get_aerial_missions_by_event);

module.exports = router;
