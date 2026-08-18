const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");
const { authorize } = require("../middlewares/authorize.js");

const {
  create_aerial_mission,
  update_aerial_mission,
  get_aerial_missions_by_event,
} = require("../controllers/aerialMissionController");

const router = express.Router();

router.post("/", authenticate, authorize("airforce"), create_aerial_mission);
router.put("/:id", authenticate, authorize("airforce"), update_aerial_mission);
router.get("/:eventId", authenticate, authorize("brigade", "airforce"), get_aerial_missions_by_event);

module.exports = router;
