const express = require("express");
const router = express.Router();
const alertService = require("../services/alertService");

router.post("/check", async (req, res) => {
  const { roomId } = req.body;

  if (!roomId) {
    return res
      .status(400)
      .json({ error: "roomId is required in the request body" });
  }

  try {
    const hasRecentAlert = await alertService.checkRecentPedocillinAlert(
      roomId
    );
    console.log("🔴 Recent Pedocillin alert check:", hasRecentAlert);

    res.json({ hasRecentAlert });
  } catch (error) {
    console.error("Error checking alert:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/record", async (req, res) => {
  const { roomId, recipientId, sender } = req.body;

  if (!roomId) {
    return res
      .status(400)
      .json({ error: "roomId is required in the request body" });
  }

  try {
    const result = await alertService.recordPedocillinAlert(
      roomId,
      recipientId,
      sender
    );
    console.log("🟢 Pedocillin alert recorded:", result);

    res.status(201).json({ success: true, result });
  } catch (error) {
    console.error("Error recording alert:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
