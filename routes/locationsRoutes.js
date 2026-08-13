const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");

const { get_locations } = require("../controllers/locationsController");

const router = express.Router();

router.get("/", authenticate, get_locations);

module.exports = router;
