const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");

const { create_injury, update_injury, get_injuries_by_event } = require("../controllers/injuriesController");

const router = express.Router();

router.post("/", authenticate, create_injury);
router.put("/:id", authenticate, update_injury);
router.get("/:eventId", authenticate, get_injuries_by_event);

module.exports = router;
