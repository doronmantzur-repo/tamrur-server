async function register(userData) {
  const query =
    "INSERT INTO users (id, username, email, password, first_name, last_name) VALUES (:id, :username, :email, :password, :first_name, :last_name) RETURNING *;";
  try {
    const [result, metadata] = await sequelize.query(query, {
      replacements: {
        id: uuidv4(),
        username: userData.user_name,
        email: userData.email,
        password: await bcrypt.hash(userData.password, 10),
        first_name: userData.first_name,
        last_name: userData.last_name,
      },
    });
    return result[0];
  } catch (error) {
    throw new Error("Error registering user");
  }

  return userNoPassword;
}