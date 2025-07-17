const axios = require("axios");

/**
 * Check if a Pedocillin alert has been sent recently
 */
exports.checkRecentPedocillinAlert = async (roomId) => {
  const headers = {
    "x-api-key": process.env.GUARDII_API_KEY,
    "Content-Type": "application/json",
  };

  try {
    const res = await axios.get(
      `${
        process.env.GUARDII_API_URL
      }/api/pedocillin/alerts/check?roomId=${encodeURIComponent(roomId)}`,
      { headers }
    );
    console.debug(`[PEDOCILLIN] Check response for room ${roomId}:`, res.data);
    return res.data.hasRecentAlert || false;
  } catch (error) {
    console.error(
      `[PEDOCILLIN] Error checking recent alerts: ${error.message}`
    );
    return false;
  }
};

/**
 * Record a Pedocillin alert
 */
exports.recordPedocillinAlert = async (
  roomId,
  recipientId = null,
  sender = null
) => {
  const headers = {
    "x-api-key": process.env.GUARDII_API_KEY,
    "Content-Type": "application/json",
  };

  const payload = { roomId };

  if (recipientId) payload.recipientMatrixUserId = recipientId;

  const senderUsername = sender?.startsWith("@")
    ? sender.split(":")[0].slice(1)
    : null;

  if (senderUsername) payload.senderUsername = senderUsername;

  console.debug(`[PEDOCILLIN] Recording alert for room ${roomId}`, payload);

  try {
    const res = await axios.post(
      `${process.env.GUARDII_API_URL}/api/pedocillin/alerts`,
      payload,
      { headers }
    );
    return res.data;
  } catch (error) {
    console.error(`[PEDOCILLIN] Error recording alert: ${error.message}`);
  }
};
