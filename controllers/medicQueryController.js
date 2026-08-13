const medicQueryModel = require("../modules/medicQueryModel.js");

async function ask_question(req, res, next) {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string") {
      throw { status: 400, message: "question is required" };
    }

    const answer = await medicQueryModel.askQuestion(question);
    res.status(200).json({ answer });
  } catch (err) {
    next(err);
  }
}

module.exports = { ask_question };
