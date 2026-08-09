const { sequelize } = require("../db/models");
const supabase = require("../db/supabaseClient");

async function register(userData) {
  const { data, error: signUpError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: { data: { role: userData.role } },
  });

  if (signUpError) {
    throw { status: signUpError.status || 400, message: signUpError.message };
  }

  // The auth.users trigger (handle_new_user) creates the matching public.users
  // profile row automatically, using the role passed in above as signup metadata.
  const query = "SELECT * FROM users WHERE id = :id;";
  try {
    const [result] = await sequelize.query(query, {
      replacements: { id: data.user.id },
    });
    const user = result[0];
    delete user.password;
    return user;
  } catch (error) {
    throw new Error("Error registering user");
  }
}

async function login(userData) {
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email: userData.email,
    password: userData.password,
  });

  if (signInError) {
    throw { status: 401, message: "Invalid email or password" };
  }

  const query = "SELECT * FROM users WHERE id = :id;";
  try {
    const [result] = await sequelize.query(query, {
      replacements: { id: data.user.id },
    });
    const user = result[0];
    if (!user) {
      throw new Error("User profile not found");
    }
    delete user.password;
    return user;
  } catch (error) {
    throw new Error("Error logging in");
  }
}

module.exports = { register, login };