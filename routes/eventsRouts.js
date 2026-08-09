const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");

const { create_event, update_event } = require("../controllers/eventsController");

const router = express.Router();

router.post("/", authenticate, create_event);
router.put("/:id", authenticate, update_event);

module.exports = router;