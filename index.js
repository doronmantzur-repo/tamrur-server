require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 8080;
const authRouter = require("./routes/authRoutes.js");
const eventRouter = require("./routes/eventsRouts.js");
const casualtiesRouter = require("./routes/casualtiesRoutes.js");
const locationsRouter = require("./routes/locationsRoutes.js");
const forcesRouter = require("./routes/forcesRoutes.js");
const evacuationsRouter = require("./routes/evacuationsRoutes.js");
const casualtiesEvacRouter = require("./routes/casualtiesEvacRoutes.js");
const casualtiesTreatmentRouter = require("./routes/casualtiesTreatmentRoutes.js");
const vitalsRouter = require("./routes/vitalsRoutes.js");
const drugsRouter = require("./routes/drugsRoutes.js");
const aerialMissionRouter = require("./routes/aerialMissionRoutes.js");
const medicQueryRouter = require("./routes/medicQueryRoutes.js");
const eventReportRouter = require("./routes/eventReportRoutes.js");
const medicQueryModel = require("./modules/medicQueryModel.js");

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
app.use("/forces", forcesRouter);
app.use("/evacuations", evacuationsRouter);
app.use("/casualties-evac", casualtiesEvacRouter);
app.use("/casualties-treatment", casualtiesTreatmentRouter);
app.use("/vitals", vitalsRouter);
app.use("/drugs", drugsRouter);
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

// Kicked off here (not awaited) so the embedding model is loading before the
// first /medic-query/ask request arrives instead of that request being the
// one to trigger it — deliberately not blocking app.listen() on this: if it's
// slow, a delayed port bind risks failing Render's deploy health check, so
// the port opens immediately and any early request just awaits this same
// promise via embedQuery instead of the port waiting on it.
medicQueryModel
  .loadEmbedder()
  .then(() => console.log("Embedding model loaded"))
  .catch((err) => console.error("Failed to load embedding model at boot:", err));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
