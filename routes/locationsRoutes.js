const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");
const { authorize } = require("../middlewares/authorize.js");

const { get_locations } = require("../controllers/locationsController");

const router = express.Router();

router.get("/", authenticate, authorize("brigade", "medic", "airforce"), get_locations);

module.exports = router;
