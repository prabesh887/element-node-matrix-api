/**
 * @param {{ messages: Array<{ sender: string, content: { body: string } }> }} raw
 * @returns {Array<{ speaker: string, message: string }>}
 */
function formatMessages(raw) {
  return raw.messages.map(({ sender, content: { body } }) => ({
    speaker: sender,
    message: body,
  }));
}

module.exports = { formatMessages };
