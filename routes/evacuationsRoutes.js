const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");
const { authorize } = require("../middlewares/authorize.js");

const {
  create_evacuation,
  update_evacuation,
  get_evacuations_by_event,
  delete_evacuation,
} = require("../controllers/evacuationsController");

const router = express.Router();

router.post("/", authenticate, authorize("brigade"), create_evacuation);
router.put("/:id", authenticate, authorize("brigade"), update_evacuation);
router.get("/:eventId", authenticate, authorize("brigade", "airforce"), get_evacuations_by_event);
router.delete("/:id", authenticate, authorize("brigade"), delete_evacuation);

module.exports = router;
