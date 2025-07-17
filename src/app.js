// app.js
require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const { redactEventPool, synapseMatrixPool } = require("./db/pool");
const messageRoutes = require("./routes/messages");
const eventRoutes = require("./routes/events");
const classifierRoutes = require("./routes/classifiers");
const alertRoutes = require("./routes/alerts");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// simple healthcheck
app.get("/health", (req, res) =>
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() })
);

// combined DB healthcheck
app.get("/health/db", async (req, res) => {
  try {
    const [p1, p2] = await Promise.all([
      redactEventPool.query("SELECT NOW()"),
      synapseMatrixPool.query("SELECT NOW()"),
    ]);

    res.status(200).json({
      status: "OK",
      redact: p1.rows[0].now,
      synapse: p2.rows[0].now,
    });
  } catch (err) {
    console.error("DB Healthcheck Error:", err);
    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed",
      error: err, // avoid sending raw error in production
      timestamp: new Date().toISOString(),
    });
  }
});

// mount your routes
// → in your route files you can now grab whichever pool you need via:
//    const { redactEventPool, synapseMatrixPool } = require("../db/pools");
app.use("/event", eventRoutes);
app.use("/message", messageRoutes);
app.use("/classifier", classifierRoutes);
app.use("/alert", alertRoutes);

// 404 + generic error handlers...
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});
app.use("*", (req, res) => res.status(404).json({ error: "Route not found" }));

// graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing DB connections");
  Promise.all([redactEventPool.end(), synapseMatrixPool.end()]).then(() => {
    console.log("All pools closed");
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
