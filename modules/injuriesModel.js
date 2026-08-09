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

async function update_injury(id, updates) {
  const query =
    "UPDATE injuries SET urgency = COALESCE(:urgency, urgency), escort = COALESCE(:escort, escort), dest_evac_recommend = COALESCE(:destEvacRecommend, dest_evac_recommend), evac_ability = COALESCE(:evacAbility, evac_ability), evac_ready = COALESCE(:evacReady, evac_ready) WHERE id = :id RETURNING *;";
  console.log("id:", id);
  console.log("urgency:", updates.urgency);
  console.log("escort:", updates.escort);
  console.log("dest-evac-recommend:", updates.destEvacRecommend);
  console.log("evac-ability:", updates.evacAbility);
  console.log("evac-ready:", updates.evacReady);
  // try {
  //   const [result] = await sequelize.query(query, {
  //     replacements: {
  //       id,
  //       urgency: updates.urgency ?? null,
  //       escort: updates.escort ?? null,
  //       destEvacRecommend: updates.destEvacRecommend ?? null,
  //       evacAbility: updates.evacAbility ?? null,
  //       evacReady: updates.evacReady ?? null,
  //     },
  //   });
  //   const injury = result[0];
  //   if (!injury) {
  //     throw new Error("Injury not found");
  //   }
  //   return injury;
  // } catch (error) {
  //   throw new Error("Error updating injury");
  // }

  return { id, ...updates };
}

module.exports = { create_injury, update_injury };
