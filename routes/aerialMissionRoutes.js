const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");

const {
  create_aerial_mission,
  update_aerial_mission,
  list_aerial_missions,
} = require("../controllers/aerialMissionController");

const router = express.Router();

router.post("/", authenticate, create_aerial_mission);
router.put("/:id", authenticate, update_aerial_mission);
router.get("/", authenticate, list_aerial_missions);

module.exports = router;
