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

async function update_event(id, updates) {
  const query =
    "UPDATE events SET name = COALESCE(:name, name), status = COALESCE(:status, status) WHERE id = :id RETURNING *;";
  console.log("id:", id);
  console.log("name:", updates.name);
  console.log("status:", updates.status);
  // try {
  //   const [result] = await sequelize.query(query, {
  //     replacements: { id, name: updates.name ?? null, status: updates.status ?? null },
  //   });
  //   const event = result[0];
  //   if (!event) {
  //     throw new Error("Event not found");
  //   }
  //   return event;
  // } catch (error) {
  //   throw new Error("Error updating event");
  // }

  return { id, ...updates };
}

module.exports = { create_event, update_event };