const express = require("express");
const router = express.Router();
const pool = require("../db/db");
const verifyApiKey = require("../middleware/verfiyApiKey");

// POST /add-3pid-email/:user_mxid
router.post("/:user_mxid", verifyApiKey, async (req, res) => {
  const { user_mxid } = req.params;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const currentTimeMs = Date.now();
  const query = `
    INSERT INTO user_threepids (user_id, medium, address, validated_at, added_at)
    VALUES ($1, 'email', $2, $3, $4)
  `;

  try {
    await pool.query(query, [user_mxid, email, currentTimeMs, currentTimeMs]);

    res.json({
      status: "success",
      user_id: user_mxid,
      medium: "email",
      address: email,
      validated_at: currentTimeMs,
      added_at: currentTimeMs,
    });
  } catch (err) {
    console.error("Error inserting email 3pid:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
