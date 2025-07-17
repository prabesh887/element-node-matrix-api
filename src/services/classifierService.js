// classifierService.js
// ------------------------------------------------------------------
const OpenAI = require("openai");
const JSON5 = require("json5");
const z = require("zod");

/* ------------------------------------------------------------------ */
/* 1.  OpenAI / HF client                                             */
/* ------------------------------------------------------------------ */
const client = new OpenAI({
  baseURL: process.env.HF_BASE_URL, // e.g. "https://api.example.com/v1"
  apiKey: process.env.HF_TOKEN,
});

/* ------------------------------------------------------------------ */
/* 2.  Runtime validation schema (Zod)                                */
/* ------------------------------------------------------------------ */
const ResultSchema = z.object({
  analysis: z.object({
    threat_score: z.number().min(0).max(1),
    detected_behaviours: z.array(z.string()),
    evaluation_description: z.string(),
  }),
  email_data: z.object({
    detection_time: z.string(),
    messages_analyzed: z.number().int(),
    threat_score_percent: z.number().int(),
    threat_level: z.string(),
    primary_threat: z.string(),
    confidence_percent: z.number().int(),
    keywords_count: z.number().int(),
    keywords: z.array(z.string()),
    participants_count: z.number().int(),
    conversation_preview: z
      .array(
        z.object({
          speaker: z.string(),
          content: z.string(),
          timestamp: z.string().optional(),
          flagged: z.boolean(),
          threat_type: z.string().optional(),
        })
      )
      .min(4)
      .max(6),
    recommended_actions: z.array(z.string()),
  }),
});

/* ------------------------------------------------------------------ */
/* 3.  Helper: strip JS‑style comments from JSON-ish text             */
/*    (avoids the ESM-only strip-json-comments package)               */
/* ------------------------------------------------------------------ */
function stripCommentsFromJSON(text = "") {
  return text
    .replace(/\/\/.*$/gm, "") // single‑line //
    .replace(/\/\*[\s\S]*?\*\//g, "") // block comments /* */
    .trim();
}

/* ------------------------------------------------------------------ */
/* 4.  Helper: extract first {...} block                              */
/* ------------------------------------------------------------------ */
function extractJSONObject(text = "") {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  return first !== -1 && last !== -1 && last > first
    ? text.slice(first, last + 1)
    : null;
}

/* ------------------------------------------------------------------ */
/* 5.  System prompt (LLama‑friendly)                                 */
/* ------------------------------------------------------------------ */
const SYSTEM_PROMPT = `
You are a strict JSON API.

▶︎ TASK
Analyse the conversation for any behaviour that endangers minors and
return **one JSON object** that fits EXACTLY the schema below.

▶︎ THREAT CATEGORIES
• Grooming & exploitation        – gifts, secrecy, special rapport
• Sexual predation & sextortion  – nude requests, threats, porn links
• Meeting solicitations          – arranging real‑life meet‑ups
• Personal‑info harvesting       – address, school, passwords, SMS codes
• Cyber‑bullying & harassment    – slurs, violent threats, doxxing
• Substance use & risky behaviour– encouraging under‑age drug/alcohol use
• Manipulation / isolation       – gaslighting, fear, coercion
• Self‑harm & extremism          – suicide encouragement, extremist recruitment

▶︎ OUTPUT RULES
1. Return **only** valid JSON (no markdown, no comments, no extra text).
2. All keys and string values in double quotes, no trailing commas.
3. "conversation_preview" must contain **4–6** items; flagged messages last and include "flagged": true + "threat_type".
4. "detection_time" and "timestamp" must be a valid ISO 8601 timestamp.

▶︎ REQUIRED SCHEMA
{
  "analysis": {
    "threat_score": 0.0,
    "detected_behaviours": [],
    "evaluation_description": ""
  },
  "email_data": {
    "detection_time": "", 
    "messages_analyzed": 0,
    "threat_score_percent": 0,
    "threat_level": "",
    "primary_threat": "",
    "confidence_percent": 0,
    "keywords_count": 0,
    "keywords": [],
    "participants_count": 0,
    "conversation_preview": [
      {
        "speaker": "",
        "content": "",
        "timestamp": "",
        "flagged": false,
        "threat_type": ""
      }
    ],
    "recommended_actions": []
  }
}

🔴 DO NOT add anything before or after the JSON.
`.trim();

/* ------------------------------------------------------------------ */
/* 6.  Main function                                                  */
/* ------------------------------------------------------------------ */
async function classifyConversation(
  messages,
  modelId = "meta-llama/llama-3.3-70b-instruct"
) {
  /* a. Fast‑exit for empty convo */
  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      analysis: {
        threat_score: 0,
        detected_behaviours: [],
        evaluation_description: "",
      },
      emailData: {},
    };
  }

  /* b. Flatten conversation for the prompt */
  const convo = messages
    .map(
      (m) =>
        `${m.speaker}${m.timestamp ? ` [${m.timestamp}]` : ""}: ${m.message}`
    )
    .join("\n");

  /* c. Call the model */
  const res = await client.chat.completions.create({
    model: modelId,
    max_tokens: 768,
    temperature: 0,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: convo },
    ],
  });

  /* d. Raw response text */
  const raw = res.choices?.[0]?.message?.content ?? "";

  /* e. Extract probable JSON segment */
  const jsonLike = extractJSONObject(raw);
  if (!jsonLike) {
    console.warn("⚠️ Could not find JSON braces in the model output.");
    return {
      analysis: {
        threat_score: 0,
        detected_behaviours: [],
        evaluation_description: "",
      },
      emailData: {},
    };
  }

  /* f. Parse (JSON → JSON5 fallback) */
  let parsed;
  try {
    parsed = JSON.parse(jsonLike);
  } catch {
    try {
      parsed = JSON5.parse(stripCommentsFromJSON(jsonLike));
    } catch (err) {
      console.error("❌ Still failed to parse JSON:", err.message);
      return {
        analysis: {
          threat_score: 0,
          detected_behaviours: [],
          evaluation_description: "",
        },
        emailData: {},
      };
    }
  }

  /* g. Validate with Zod */
  const safe = ResultSchema.safeParse(parsed);
  if (!safe.success) {
    console.warn("⚠️ Validation failed:", safe.error.issues);
    return {
      analysis: {
        threat_score: 0,
        detected_behaviours: [],
        evaluation_description: "",
      },
      emailData: {},
    };
  }

  /* h. All good */
  return {
    analysis: safe.data.analysis,
    emailData: safe.data.email_data,
  };
}

module.exports = { classifyConversation };
