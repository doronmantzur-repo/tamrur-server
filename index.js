const express = require("express");
const app = express();
const port = 8080;
const authRouter = require("./routes/authRoutes.js");
const eventRouter = require("./routes/eventsRouts.js");
const injuriesRouter = require("./routes/injuriesRoutes.js");
const landingPadsRouter = require("./routes/landingPadsRoutes.js");
const evacuationsRouter = require("./routes/evacuationsRoutes.js");
const injuriesEvacRouter = require("./routes/injuriesEvacRoutes.js");
const injuriesTreatmentRouter = require("./routes/injuriesTreatmentRoutes.js");
const vitalsRouter = require("./routes/vitalsRoutes.js");

app.use(express.json());
app.use("/auth", authRouter);
app.use("/events", eventRouter);
app.use("/injuries", injuriesRouter);
app.use("/landing-pads", landingPadsRouter);
app.use("/evacuations", evacuationsRouter);
app.use("/injuries-evac", injuriesEvacRouter);
app.use("/injuries-treatment", injuriesTreatmentRouter);
app.use("/vitals", vitalsRouter);


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