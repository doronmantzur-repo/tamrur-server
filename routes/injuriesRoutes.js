const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");

const { create_injury, update_injury } = require("../controllers/injuriesController");

const router = express.Router();

router.post("/", authenticate, create_injury);
router.put("/:id", authenticate, update_injury);

module.exports = router;
