/**
 * @param {{ messages: Array<{ sender: string, content: { body: string } }> }} raw
 * @returns {Array<{ speaker: string, message: string }>}
 */
function formatMessages(messages) {
  return messages.map(
    ({ sender_displayname, content: { body }, origin_server_ts }) => ({
      speaker: sender_displayname,
      message: body,
      timestamp: origin_server_ts || new Date().toISOString(),
    })
  );
}

module.exports = { formatMessages };
