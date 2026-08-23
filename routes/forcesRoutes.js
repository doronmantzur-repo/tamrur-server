const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");
const { authorize } = require("../middlewares/authorize.js");

const { get_forces } = require("../controllers/forcesController");

const router = express.Router();

// Read-only access for the command dashboard; see locationsRoutes.js.
router.get("/", authenticate, authorize("brigade", "medic", "airforce", "supervisor"), get_forces);

module.exports = router;
