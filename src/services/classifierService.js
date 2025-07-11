// src/services/classifyService.js
const OpenAI = require("openai");

const DEFAULT_PEDOCILLIN_SENSITIVITY = 0.5;

const client = new OpenAI({
  baseURL: process.env.HF_BASE_URL,
  apiKey: process.env.HF_TOKEN,
});

/**
 * Analyze a conversation for predatory risk.
 *
 * @param {Array<{speaker:string, message:string}>} messages
 * @param {string} modelId
 * @returns {Promise<number>} threat_score between 0.0 and 1.0
 */
async function classifyConversation(messages, modelId) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 0.0;
  }

  const systemPrompt = `
You are an expert content safety analyst with specific training in detecting grooming, predatory behavior, and endangerment of minors.

Analyse the provided conversation to determine if it contains patterns consistent with:
- An adult attempting to build inappropriate trust with a minor
- Someone soliciting personal information from a minor
- Requests to meet in person with a minor
- Offering gifts or incentives to entice a minor
- Attempting to isolate a minor from their support network
- Using manipulative tactics to engage with a minor
- Asking for or sharing inappropriate content with a minor
- Sexual comments or suggestions directed at a minor

Return only a single JSON object with:
  • threat_score (float 0.0–1.0)
  • detected_behaviours (string[])
  • evaluation_description (string)

Your response should contain ONLY the JSON object with no other text or explanation.
  `.trim();

  const convo = messages
    .map((m) => `Person ${m.speaker}: ${m.message}`)
    .join("\n");
  console.log("🚀 ~ classifyConversation ~ convo:", convo);

  try {
    const res = await client.chat.completions.create({
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze for risk:\n\n${convo}` },
      ],
      max_tokens: 400,
      temperature: 0.0,
      stream: false,
    });

    let content = res.choices[0].message.content.trim();
    console.log("🚀 ~ classifyConversation ~ content:", content);

    // strip code fences
    if (content.startsWith("```") && content.endsWith("```")) {
      content = content.split("\n").slice(1, -1).join("\n").trim();
    }
    // strip leading “json”
    if (content.toLowerCase().startsWith("json")) {
      content = content.slice(4).trim();
    }

    // parse
    let score = DEFAULT_PEDOCILLIN_SENSITIVITY;
    try {
      const parsed = JSON.parse(content);
      score = parseFloat(parsed.threat_score) || score;
    } catch {
      const m = content.match(/\d+(\.\d+)?/);
      if (m) score = parseFloat(m[0]);
    }

    return Math.min(1, Math.max(0, score));
  } catch (err) {
    if (err.name === "RepositoryNotFoundError") {
      const e = new Error("Model not found");
      e.isRepoNotFound = true;
      throw e;
    }
    console.error("Classification error:", err);
    return 0.0;
  }
}

module.exports = { classifyConversation };
