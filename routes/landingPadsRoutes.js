const express = require("express");

const { get_landing_pads } = require("../controllers/landingPadsController");

const router = express.Router();

router.get("/", get_landing_pads);

module.exports = router;
