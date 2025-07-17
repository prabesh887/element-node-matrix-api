const express = require("express");
const router = express.Router();
const pool = require("../db/db");
const verifyApiKey = require("../middleware/verfiyApiKey");
const { addThreePidEmail } = require("../services/userService");

// POST /add-3pid-email/:user_mxid
router.post("/:user_mxid", verifyApiKey, async (req, res) => {
  const { user_mxid } = req.params;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const result = await addThreePidEmail(user_mxid, email);
    res.json(result);
  } catch (err) {
    console.error("❌ Error adding 3PID email:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
