const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");
const { authorize } = require("../middlewares/authorize.js");

const { create_casualty, update_casualty, get_casualties_by_event } = require("../controllers/casualtiesController");

const router = express.Router();

router.post("/", authenticate, authorize("medic"), create_casualty);
router.put("/:id", authenticate, authorize("medic"), update_casualty);
router.get("/:eventId", authenticate, authorize("brigade", "medic", "supervisor"), get_casualties_by_event);

module.exports = router;
