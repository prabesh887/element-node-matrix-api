const express = require("express");
const dotenv = require("dotenv");
const emailRoutes = require("./routes/email");
const pool = require("./db/db");

dotenv.config();

const app = express();
app.use(express.json());

// ✅ Simple GET /ping health check
app.get("/ping", (req, res) => {
  res.json({ status: "ok", message: "Server is up and running!" });
});

// ✅ DB connection check
app.get("/db-check", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "ok", db_time: result.rows[0].now });
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: err.message, // Optional: add this for dev/debugging
    });
  }
});

// ✅ POST /add-3pid-email/:user_mxid route
// This route allows adding an email 3rd party identifier (3pid) for a user
app.use("/add-3pid-email", emailRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
