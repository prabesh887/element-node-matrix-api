const express = require("express");
const router = express.Router();
const verifyApiKey = require("../middleware/verfiyApiKey");
const {
  redactMessage,
  getRecentMessagesAndClassify,
} = require("../services/messageService");

// POST /message/redact
router.post("/redact", verifyApiKey, async (req, res) => {
  const { eventId, roomId, type, reason } = req.body;

  if (!eventId || !roomId || !type) {
    return res.status(400).json({
      error: "eventId, roomId, and type are required in the request body",
    });
  }

  try {
    const response = await redactMessage({ eventId, roomId, type, reason });
    res.status(200).json(response);
  } catch (err) {
    console.error("❌ Redaction failed:", err);
    res.status(err.statusCode || 500).json({
      error: err.message || "Internal server error",
    });
  }
});

// POST /message/room
router.post("/room", async (req, res) => {
  try {
    const result = await getRecentMessagesAndClassify(req.body);
    res.json(result);
  } catch (err) {
    console.error("❌ Error getting/classifying messages:", err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

module.exports = router;
