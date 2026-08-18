const jwt = require("jsonwebtoken");
require("dotenv").config();

function authenticate(req, res, next) {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    throw { status: 401, message: "Access denied. No token provided." };
  }
  const token = authHeader.replace("Bearer ", "");
  try {
    const decodedUser = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedUser; // add decoded user in the rquest (so other handlers will have the authentication info)
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw { status: 401, message: "Token expired." };
    }
    throw { status: 401, message: "Invalid token." };
  }
  // Further token validation logic would go here
  next();
}

module.exports = { authenticate };
