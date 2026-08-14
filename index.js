const express = require("express");
const cors = require("cors");
const app = express();
const port = 8080;
const authRouter = require("./routes/authRoutes.js");
const eventRouter = require("./routes/eventsRouts.js");
const casualtiesRouter = require("./routes/casualtiesRoutes.js");
const locationsRouter = require("./routes/locationsRoutes.js");
const evacuationsRouter = require("./routes/evacuationsRoutes.js");
const injuriesEvacRouter = require("./routes/injuriesEvacRoutes.js");
const injuriesTreatmentRouter = require("./routes/injuriesTreatmentRoutes.js");
const vitalsRouter = require("./routes/vitalsRoutes.js");
const aerialMissionRouter = require("./routes/aerialMissionRoutes.js");
const medicQueryRouter = require("./routes/medicQueryRoutes.js");
const eventReportRouter = require("./routes/eventReportRoutes.js");

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use("/auth", authRouter);
app.use("/events", eventRouter);
app.use("/casualties", casualtiesRouter);
app.use("/locations", locationsRouter);
app.use("/evacuations", evacuationsRouter);
app.use("/injuries-evac", injuriesEvacRouter);
app.use("/injuries-treatment", injuriesTreatmentRouter);
app.use("/vitals", vitalsRouter);
app.use("/aerial-mission", aerialMissionRouter);
app.use("/medic-query", medicQueryRouter);
app.use("/event-report", eventReportRouter);

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: true,
    message: err.message,
    statusCode: err.status || 500,
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
