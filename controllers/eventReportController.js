const eventReportModel = require("../modules/eventReportModel.js");

async function get_event_report_data(req, res, next) {
  try {
    const { eventId } = req.params;
    const data = await eventReportModel.getEventReportData(eventId);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { get_event_report_data };
