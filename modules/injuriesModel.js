async function create_injury(injuryData) {
  const query =
    "INSERT INTO injuries (id, urgency) VALUES (:id, :urgency) RETURNING *;";
  console.log("id:", injuryData.id);
  console.log("urgency:", injuryData.urgency);
  // try {
  //   const [result] = await sequelize.query(query, {
  //     replacements: { id: injuryData.id, urgency: injuryData.urgency ?? null },
  //   });
  //   return result[0];
  // } catch (error) {
  //   throw new Error("Error creating injury record");
  // }

  return injuryData;
}

module.exports = { create_injury };
