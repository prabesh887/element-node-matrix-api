const express = require("express");
const router = express.Router();
const pool = require("../db/db");
const verifyApiKey = require("../middleware/verfiyApiKey");

// GET /message/:eventId
router.get("/:eventId", verifyApiKey, async (req, res) => {
  const { eventId } = req.params;

  try {
    const query = `
      SELECT event_id, room_id, type, sender, origin_server_ts, content
      FROM events
      WHERE event_id = $1
    `;

    const result = await pool.query(query, [eventId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Parse JSON content
    const row = result.rows[0];
    row.content = JSON.parse(row.content);

    res.json(row);
  } catch (err) {
    console.error("❌ Error fetching event:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /message/:eventId/redact
router.post("/:eventId/redact", verifyApiKey, async (req, res) => {
  const { eventId } = req.params;
  const { roomId } = req.body;
  const accessToken = process.env.MATRIX_ADMIN_TOKEN;

  if (!roomId) {
    return res.status(400).json({ error: "roomId is required" });
  }

  const txnId = Date.now(); // Unique transaction ID
  const url = `${process.env.MATRIX_BASE_URL}/_matrix/client/v3/rooms/${roomId}/redact/${eventId}/${txnId}`;

  try {
    const result = await axios.post(
      url,
      { reason: "Blocked message" },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    console.log("🚀 ~ router.post ~ result:", result);

    res.json({ status: "success", redacted: eventId });
  } catch (err) {
    console.error("Redact failed:", err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data || err.message,
    });
  }
});

module.exports = router;
