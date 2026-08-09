const injuriesModel = require("../modules/injuriesModel.js");

const URGENCY_VALUES = ["non urgent", "urgent", "expectant", "dec"];

async function create_injury(req, res, next) {
  try {
    console.log(req.body);
    const { id, urgency } = req.body;

    if (!id) {
      throw { status: 400, message: "id missing" };
    }

    if (urgency !== undefined && !URGENCY_VALUES.includes(urgency)) {
      throw { status: 400, message: `urgency must be one of: ${URGENCY_VALUES.join(", ")}` };
    }

    const injury = await injuriesModel.create_injury({ id, urgency });
    res.status(201).json({ injury });
  } catch (err) {
    next(err);
  }
}

module.exports = { create_injury };
