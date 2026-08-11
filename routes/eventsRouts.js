const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");

const { create_event, get_event_by_id, update_event } = require("../controllers/eventsController");

const router = express.Router();

router.post("/", authenticate, create_event);
router.get("/:id", authenticate, get_event_by_id);
router.put("/:id", authenticate, update_event);

module.exports = router;