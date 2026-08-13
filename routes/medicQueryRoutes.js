const express = require("express");
const { authenticate } = require("../middlewares/authenticate.js");

const { ask_question } = require("../controllers/medicQueryController");

const router = express.Router();

router.post("/ask", authenticate, ask_question);

module.exports = router;
