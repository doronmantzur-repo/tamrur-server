const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");

const { create_casualty, update_casualty, get_casualties_by_event } = require("../controllers/casualtiesController");

const router = express.Router();

router.post("/", authenticate, create_casualty);
router.put("/:id", authenticate, update_casualty);
router.get("/:eventId", authenticate, get_casualties_by_event);

module.exports = router;
