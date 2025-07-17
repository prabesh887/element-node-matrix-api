const axios = require("axios");
const { classifyConversation } = require("./classifierService");
const { getUserEmail } = require("./userService");
const { synapseMatrixPool } = require("../db/pool");
const { formatMessages } = require("../utils/formatMessages");
const { initMailer } = require("../utils/mailer");
const {
  checkRecentPedocillinAlert,
  recordPedocillinAlert,
} = require("./alertService");
const data = require("../data");

let transporter;
initMailer()
  .then((t) => (transporter = t))
  .catch((err) => console.error("Failed to init mailer:", err));

exports.redactMessage = async ({ eventId, roomId, type, reason }) => {
  const tokenMap = {
    instagram: process.env.INSTAGRAM_BOT_TOKEN,
    twitter: process.env.TWITTER_BOT_TOKEN,
  };

  const accessToken = tokenMap[type];

  if (!accessToken) {
    const error = new Error("Unsupported type or missing token");
    error.statusCode = 400;
    throw error;
  }

  const transactionId = `txn_${Date.now()}`;
  const url = `${process.env.MATRIX_BASE_URL}/_matrix/client/v3/rooms/${roomId}/redact/${eventId}/${transactionId}`;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const payload = {
    reason: reason || "Blocked message by moderator",
  };

  const result = await axios.put(url, payload, { headers });

  return {
    status: "success",
    redacted: eventId,
    txnId: transactionId,
    response: result.data,
  };
};

exports.getRecentMessagesAndClassify = async ({
  roomId,
  platform,
  recipientId,
  senderId,
}) => {
  if (!roomId) {
    const error = new Error("roomId is required in the request body");
    error.statusCode = 400;
    throw error;
  }

  const checkAlerts = await checkRecentPedocillinAlert(roomId);
  if (checkAlerts) {
    return {
      roomId,
      checkAlerts,
    };
  }

  //   const messages = await fetchMessages(roomId);

  const formattedMessages = formatMessages(data.raw);

  const { analysis, emailData } = await classifyConversation(
    formattedMessages,
    process.env.HF_MODEL
  );

  console.log("🔴 Threat Score:", analysis.threat_score);

  if (analysis.threat_score > 0.5 && recipientId) {
    const userDetails = await getUserEmail(recipientId);
    if (userDetails?.user?.email) {
      emailData.parentName =
        userDetails.user.firstName + " " + userDetails.user.lastName;
      emailData.platform = platform;
      emailData.chatName =
        emailData.participants_count > 2
          ? emailData.chatName
          : "Private Message";

      emailData.recipientId = recipientId;

      console.log(
        "🔴 Sending alert email to:",
        userDetails.user.email,
        emailData
      );

      await transporter.sendMail({
        from: `"Guardii.ai" <${process.env.SMTP_FROM}>`,
        to: userDetails.user.email,
        subject: `🚨 Safety Alert`,
        template: "notification",
        context: {
          ...emailData,
          threatLevelClass: emailData.threat_level.toLowerCase(),
        },
      });

      await recordPedocillinAlert(roomId, recipientId, senderId);
    }
  }

  return {
    roomId,
    threatScore: analysis.threat_score,
    analysis,
  };
};

async function fetchMessages(roomId, recipientId, sender) {
  const query = `
    WITH latest_member_event AS (
  SELECT DISTINCT ON (room_id, sender)
    ev.room_id,
    ev.sender,
    ej.json::jsonb->'content'->>'displayname' AS displayname
  FROM events ev
  JOIN event_json ej ON ev.event_id = ej.event_id
  WHERE ev.type = 'm.room.member'
    AND ej.json::jsonb->>'state_key' = ev.sender
    AND ej.json::jsonb->'content'->>'membership' = 'join'
  ORDER BY ev.room_id, ev.sender, ev.origin_server_ts DESC
)

SELECT
  e.event_id,
  e.room_id,
  e.type,
  e.sender,
  e.origin_server_ts,
  ej.json::jsonb->'content' AS content,
  lme.displayname AS sender_displayname
FROM events e
JOIN event_json ej ON e.event_id = ej.event_id
LEFT JOIN latest_member_event lme
  ON lme.room_id = e.room_id AND lme.sender = e.sender
WHERE e.room_id = $1
  AND e.type = 'm.room.message'
ORDER BY e.origin_server_ts DESC
LIMIT 20;

    `;

  const result = await synapseMatrixPool.query(query, [roomId]);

  if (result.rows.length === 0) {
    const error = new Error("No messages found in this room");
    error.statusCode = 404;
    throw error;
  }

  return result.rows;
}
