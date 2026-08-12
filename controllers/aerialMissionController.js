const aerialMissionModel = require("../modules/aerialMissionModel.js");

const REQUEST_STATUS_VALUES = ["no_neede", "needed", "in_progress", "approved", "denied"];

async function create_aerial_mission(req, res, next) {
  try {
    console.log(req.body);
    const { radioSign, landingPadId, requestStatus } = req.body;

    if (requestStatus !== undefined && !REQUEST_STATUS_VALUES.includes(requestStatus)) {
      throw { status: 400, message: `request-status must be one of: ${REQUEST_STATUS_VALUES.join(", ")}` };
    }

    const aerialMission = await aerialMissionModel.create_aerial_mission({ radioSign, landingPadId, requestStatus });
    res.status(201).json({ aerialMission });
  } catch (err) {
    next(err);
  }
}

async function update_aerial_mission(req, res, next) {
  try {
    console.log(req.body);
    const { id } = req.params;
    const { radioSign, landingPadId, requestStatus } = req.body;

    if (radioSign === undefined && landingPadId === undefined && requestStatus === undefined) {
      throw { status: 400, message: "at least one field must be provided" };
    }

    if (requestStatus !== undefined && !REQUEST_STATUS_VALUES.includes(requestStatus)) {
      throw { status: 400, message: `request-status must be one of: ${REQUEST_STATUS_VALUES.join(", ")}` };
    }

    const aerialMission = await aerialMissionModel.update_aerial_mission(id, { radioSign, landingPadId, requestStatus });
    res.status(200).json({ aerialMission });
  } catch (err) {
    next(err);
  }
}

async function list_aerial_missions(req, res, next) {
  try {
    const aerialMissions = await aerialMissionModel.list_aerial_missions();
    res.status(200).json({ aerialMissions });
  } catch (err) {
    next(err);
  }
}

module.exports = { create_aerial_mission, update_aerial_mission, list_aerial_missions };
