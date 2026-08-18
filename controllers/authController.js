const authModel = require("../modules/authModel.js");
const jwt = require("jsonwebtoken");
const { ROLES } = require("../constants/roles.js");
require("dotenv").config();


async function register(req, res, next) {
  try {
    console.log(req.body);
    const { role, email, password} = req.body;

    if (!email || !password) {
      throw { status: 400, message: "email or password missing" };
    }

    if (!role || !ROLES.includes(role)) {
      throw { status: 400, message: `role must be one of: ${ROLES.join(", ")}` };
    }

    const user = await authModel.register({ role, email, password});
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    console.log(req.body);
    const { role, email, password } = req.body;

    if (!email || !password) {
      throw { status: 400, message: "email or password missing" };
    }

    const user = await authModel.login({ role, email, password });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );
    res.status(200).json({ user, token });
  } catch (err) {
    next(err);
  }
}

module.exports = {register, login};