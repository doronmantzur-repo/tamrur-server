require("dotenv").config();


async function register(req, res, next) {
  try {
    console.log(req.body);
    const { user_name, email, password, first_name, last_name } = req.body;

    if (!email || !password) {
      throw { status: 400, message: "email or password missing" };
    }

    const user = await authModel.register({ user_name, email, password, first_name, last_name: last_name });
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "24h" });
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

module.exports = {register};