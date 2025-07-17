// src/utils/mailer.js
require("dotenv").config();
const nodemailer = require("nodemailer");
const path = require("path");

let transporterPromise = null;

/**
 * Initializes and returns a Promise for a fully‐configured transporter.
 * Uses dynamic import() for the ESM only hbs plugin.
 */
function initMailer() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    // 1️⃣ dynamic import of the ESM plugin
    const { default: hbs } = await import("nodemailer-express-handlebars");

    // 2️⃣ create the transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: +process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 3️⃣ attach Handlebars
    transporter.use(
      "compile",
      hbs({
        viewEngine: {
          extname: ".hbs",
          layoutsDir: path.resolve(__dirname, "../templates"),
          defaultLayout: false,
          helpers: {
            eq: (a, b) => a === b,
            /**
             * formatDateTime:
             * - If it looks like an ISO string, parse it.
             * - If it’s all digits, treat as epoch ms.
             * - Otherwise, return it unchanged.
             */
            formatDateTime: (value) => {
              if (typeof value !== "string" && typeof value !== "number")
                return value;

              // Check if it's a valid ISO string (with or without milliseconds)
              const isIsoDate =
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|([+-]\d{2}:\d{2}))?$/.test(
                  value
                );
              if (isIsoDate) {
                return new Date(value).toLocaleString(); // Use user's locale
              }

              // Check if it's epoch milliseconds
              const isEpoch = /^\d+$/.test(value);
              if (isEpoch) {
                return new Date(+value).toLocaleString();
              }

              return value;
            },
          },
        },
        viewPath: path.resolve(__dirname, "../templates"),
        extName: ".hbs",
      })
    );

    return transporter;
  })();

  return transporterPromise;
}

module.exports = { initMailer };
