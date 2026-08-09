const { sequelize } = require("../db/models");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

async function register(userData) {
  const query =
    "INSERT INTO users (id, role, email, password) VALUES (:id, :role, :email, :password) RETURNING *;";
  console.log("role:", userData.role);
  console.log("email:", userData.email);
  console.log("password:", userData.password);
  // try {
  //   const [result] = await sequelize.query(query, {
  //     replacements: {
  //       id: uuidv4(),
  //       username: userData.user_name,
  //       email: userData.email,
  //       password: await bcrypt.hash(userData.password, 10),
  //       first_name: userData.first_name,
  //       last_name: userData.last_name,
  //     },
  //   });
  //   return result[0];
  // } catch (error) {
  //   throw new Error("Error registering user");
  // }

  return userData;
}

async function login(userData) {
  const query = "SELECT * FROM users WHERE role = :role AND email = :email;";
  console.log("role:", userData.role);
  console.log("email:", userData.email);
  console.log("password:", userData.password);
  // try {
  //   const [result] = await sequelize.query(query, {
  //     replacements: { role: userData.role, email: userData.email },
  //   });
  //   const user = result[0];
  //   if (!user) {
  //     throw new Error("Invalid email or password");
  //   }
  //   const match = await bcrypt.compare(userData.password, user.password);
  //   if (!match) {
  //     throw new Error("Invalid email or password");
  //   }
  //   return user;
  // } catch (error) {
  //   throw new Error("Error logging in");
  // }

  return userData;
}

module.exports = { register, login };