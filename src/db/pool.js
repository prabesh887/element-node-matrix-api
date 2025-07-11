// db/pools.js
const { Pool } = require("pg");

// helper to build a pool from a given env-prefix
function makePool(prefix) {
  return new Pool({
    user: process.env[`${prefix}_POSTGRES_USER`],
    host: process.env[`${prefix}_POSTGRES_HOST`],
    database: process.env[`${prefix}_POSTGRES_DB`],
    password: process.env[`${prefix}_POSTGRES_PASSWORD`],
    port: parseInt(process.env[`${prefix}_POSTGRES_PORT`], 10),
    max: 10,
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
  });
}

const redactEventPool = makePool("RE");
const synapseMatrixPool = makePool("SYNAPSES");

// optional: log on connect / error
[
  { pool: redactEventPool, name: "Redact Database" },
  { pool: synapseMatrixPool, name: "Synapse Matrix Database" },
].forEach(({ pool, name }) => {
  pool.on("connect", () => console.log(`Connected to ${name} DB`));
  pool.on("error", (err) => {
    console.error(`Unexpected error on idle ${name} client`, err);
    process.exit(-1);
  });
});

module.exports = { redactEventPool, synapseMatrixPool };
