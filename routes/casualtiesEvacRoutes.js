const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");

const {
  create_casualty_evac,
  update_casualty_evac,
  get_casualty_evac_by_event,
} = require("../controllers/casualtiesEvacController");

const router = express.Router();

router.post("/", authenticate, create_casualty_evac);
router.put("/:id", authenticate, update_casualty_evac);
router.get("/:eventId", authenticate, get_casualty_evac_by_event);

module.exports = router;
