const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");

const { get_landing_pads } = require("../controllers/landingPadsController");

const router = express.Router();

router.get("/", authenticate, get_landing_pads);

module.exports = router;
