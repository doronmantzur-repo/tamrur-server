const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");
const { authorize } = require("../middlewares/authorize.js");

const { get_locations } = require("../controllers/locationsController");

const router = express.Router();

// `supervisor` is read-only by design: it appears on GET routes so the
// command dashboard can render the same picture the brigade sees, and on no
// write route anywhere.
router.get("/", authenticate, authorize("brigade", "medic", "airforce", "supervisor"), get_locations);

module.exports = router;
