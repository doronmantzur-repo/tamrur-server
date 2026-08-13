const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");

const { get_event_report_data } = require("../controllers/eventReportController");

const router = express.Router();

router.get("/:eventId", authenticate, get_event_report_data);

module.exports = router;
