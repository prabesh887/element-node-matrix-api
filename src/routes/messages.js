const express = require("express");
const router = express.Router();
const axios = require("axios");
const verifyApiKey = require("../middleware/verfiyApiKey");

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

module.exports = router;
