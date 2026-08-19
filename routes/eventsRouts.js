const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");
const { authorize } = require("../middlewares/authorize.js");

const { create_event, list_events, get_event_by_id, update_event, close_event } = require("../controllers/eventsController");

const router = express.Router();

router.post("/", authenticate, authorize("brigade", "medic"), create_event);
router.get("/", authenticate, authorize("brigade", "medic", "airforce", "supervisor"), list_events);
router.get("/:id", authenticate, authorize("brigade", "medic", "airforce", "supervisor"), get_event_by_id);
router.put("/:id", authenticate, authorize("brigade", "medic"), update_event);
router.post("/:id/close", authenticate, authorize("brigade", "medic"), close_event);

module.exports = router;