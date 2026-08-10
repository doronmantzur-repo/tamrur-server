const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");

const { create_evacuation, update_evacuation, get_evacuations_by_event } = require("../controllers/evacuationsController");

const router = express.Router();

router.post("/", authenticate, create_evacuation);
router.put("/:id", authenticate, update_evacuation);
router.get("/:eventId", authenticate, get_evacuations_by_event);

module.exports = router;
