const express = require("express");
const router = express.Router();
const axios = require("axios");
const verifyApiKey = require("../middleware/verfiyApiKey");
const { synapseMatrixPool } = require("../db/pool");
const { formatMessages } = require("../utils/formatMessages");
const { classifyConversation } = require("../services/classifierService");

// ✅ POST /message/redact - redact message by passing eventId + roomId in body using Instagram Bot Access Token
router.post("/redact", verifyApiKey, async (req, res) => {
  const { eventId, roomId, type, reason } = req.body;
  let accessToken;
  if (type == "instagram") {
    accessToken = process.env.INSTAGRAM_BOT_TOKEN;
  }
  if (type == "twitter") {
    accessToken = process.env.TWITTER_BOT_TOKEN;
  }
  console.log("🔴 Redact message type, accessToken:", type, accessToken);

  if (!eventId || !roomId) {
    return res.status(400).json({
      error: "eventId and roomId are required in body",
    });
  }

  const transactionId = `txn_${Date.now()}`;

  const url = `${process.env.MATRIX_BASE_URL}/_matrix/client/v3/rooms/${roomId}/redact/${eventId}/${transactionId}`;

  console.log(`🔴 Redacting event ${eventId} in room ${roomId} via Client API`);
  console.log("🔴 Client API URL:", url);

  try {
    const result = await axios.put(
      url,
      { reason: reason || "Blocked message by moderator" },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("🚫 Redacted event via Client API:", result.data);

    res.json({ status: "success", redacted: eventId, txnId: transactionId });
  } catch (err) {
    console.error("❌ Redact (client) failed:", err.message);
    console.error(err.response?.data || err);
    res.status(err.response?.status || 500).json({
      error: err.response?.data || err.message,
    });
  }
});

// ✅ GET /messages/room - get last 20 messages in a room
router.post("/room", async (req, res) => {
  const { roomId } = req.body;

  if (!roomId) {
    return res
      .status(400)
      .json({ error: "roomId is required in the request body" });
  }

  try {
    const query = `
      SELECT
        e.event_id,
        e.room_id,
        e.type,
        e.sender,
        e.origin_server_ts,
        ej.json::jsonb->'content' AS content
      FROM events e
      JOIN event_json ej ON e.event_id = ej.event_id
      WHERE e.room_id = $1
        AND e.type = 'm.room.message'
      ORDER BY e.origin_server_ts DESC
      LIMIT 20
    `;

    const result = await synapseMatrixPool.query(query, [roomId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No messages found in this room" });
    }
    const raw = result.rows;

    const clean = formatMessages(raw);

    // Classify conversation
    const threat_score = await classifyConversation(
      clean,
      process.env.HF_MODEL
    );

    res.json({
      roomId,
      threat_score,
    });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
