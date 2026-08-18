const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");
const { authorize } = require("../middlewares/authorize.js");

const {
  create_drug,
  update_drug,
  delete_drug,
  get_drugs_by_event,
  get_drugs_by_casualty,
} = require("../controllers/drugsController");

const router = express.Router();

router.post("/", authenticate, authorize("medic"), create_drug);
router.get("/by-event/:eventId", authenticate, authorize("brigade", "medic", "supervisor"), get_drugs_by_event);
router.get("/by-casualty/:casualtyId", authenticate, authorize("brigade", "medic", "supervisor"), get_drugs_by_casualty);
router.put("/record/:id", authenticate, authorize("medic"), update_drug);
router.delete("/record/:id", authenticate, authorize("medic"), delete_drug);

module.exports = router;
