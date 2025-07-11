// src/routes/classify.js
const express = require("express");
const { classifyConversation } = require("../services/classifierService");
const router = express.Router();

/**
 * POST /api/classify
 * Body: {
 *   modelId?: string,
 *   messages: [{ speaker: string, message: string }]
 * }
 */
router.post("/classify", async (req, res) => {
  const { modelId = process.env.HF_MODEL, messages } = req.body;
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "messages must be an array" });
  }

  try {
    const threat_score = await classifyConversation(messages, modelId);
    res.json({ threat_score });
  } catch (err) {
    if (err.isRepoNotFound) {
      return res.status(404).json({ error: "Model not found" });
    }
    res
      .status(500)
      .json({ error: "Classification failed", details: err.message });
  }
});

module.exports = router;
