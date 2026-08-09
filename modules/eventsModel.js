async function create_event(userData) {
//   const query = "SELECT * FROM users WHERE role = :role AND email = :email;";
  console.log("type:", userData.type);
  console.log("location:", userData.location);
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

module.exports = { create_event };