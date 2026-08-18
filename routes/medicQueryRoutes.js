const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");
const { authorize } = require("../middlewares/authorize.js");

const { ask_question } = require("../controllers/medicQueryController");
const { set_evac_priority } = require("../controllers/evacPriorityController");

const router = express.Router();

router.post("/ask", authenticate, authorize("medic"), ask_question);
router.post("/priority/:eventId", authenticate, authorize("medic"), set_evac_priority);

module.exports = router;
