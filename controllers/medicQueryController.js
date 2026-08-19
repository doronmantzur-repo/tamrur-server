const medicQueryModel = require("../modules/medicQueryModel.js");

// Streamed as Server-Sent Events instead of a single JSON response, so the
// client can show each retrieval step and the answer's own tokens as they
// happen rather than only once the whole pipeline finishes.
async function ask_question(req, res, next) {
  const { question, history } = req.body;

  if (!question || typeof question !== "string") {
    return next({ status: 400, message: "question is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  function emit(event, data) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  try {
    await medicQueryModel.askQuestionStream(question, emit, { history });
  } catch (err) {
    emit("error", { message: err.message || "השאלה נכשלה" });
  } finally {
    res.end();
  }
}

module.exports = { ask_question };
