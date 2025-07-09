const dotenv = require("dotenv");
dotenv.config();

function verifyApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  console.log("API Key:", apiKey);

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: "Invalid API Key" });
  }

  next();
}

module.exports = verifyApiKey;
