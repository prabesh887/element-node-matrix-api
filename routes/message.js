const express = require("express");
const router = express.Router();
const pool = require("../db/db");
const axios = require("axios");
const verifyApiKey = require("../middleware/verfiyApiKey");

// POST /message - fetch message by eventId
router.post("/", verifyApiKey, async (req, res) => {
  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({ error: "Missing eventId in request body" });
  }

  try {
    const query = `
      SELECT e.event_id, e.room_id, e.type, e.sender, e.origin_server_ts, ej.content
      FROM events e
      JOIN event_json ej ON e.event_id = ej.event_id
      WHERE e.event_id = $1
    `;

    const result = await pool.query(query, [eventId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found", eventId });
    }

    const row = result.rows[0];

    try {
      row.content = row.content ? JSON.parse(row.content) : {};
    } catch {
      row.content = { error: "Invalid JSON in content" };
    }

    res.json(row);
  } catch (err) {
    console.error("❌ Error fetching event:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ POST /message/redact - redact message by passing eventId + roomId in body
router.post("/redact", verifyApiKey, async (req, res) => {
  const { eventId, roomId } = req.body;
  const accessToken = process.env.MATRIX_ADMIN_TOKEN;

  if (!eventId || !roomId) {
    return res
      .status(400)
      .json({ error: "eventId and roomId are required in body" });
  }

  const txnId = Date.now(); // Unique transaction ID
  const url = `${
    process.env.MATRIX_BASE_URL
  }/_matrix/client/v3/rooms/${encodeURIComponent(
    roomId
  )}/redact/${encodeURIComponent(eventId)}/${txnId}`;

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
    console.log("🚀 Redacted event:", result.data);

    res.json({ status: "success", redacted: eventId });
  } catch (err) {
    console.error("Redact failed:", err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data || err.message,
    });
  }
});

module.exports = router;
