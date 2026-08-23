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
// Read-only access for the command dashboard. Deliberately not added to the
// post/put/delete routes above — command watches, it does not dispatch.
router.get("/:eventId", authenticate, authorize("brigade", "airforce", "supervisor"), get_evacuations_by_event);
router.delete("/:id", authenticate, authorize("brigade"), delete_evacuation);

module.exports = router;
