async function get_landing_pads() {
  const query = "SELECT * FROM landing_pads;";
  console.log("query:", query);
  // try {
  //   const [result] = await sequelize.query(query);
  //   return result;
  // } catch (error) {
  //   throw new Error("Error fetching landing pads");
  // }

  return [];
}

module.exports = { get_landing_pads };
