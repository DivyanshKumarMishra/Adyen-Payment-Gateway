const { Pool } = require("pg");
const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = require("../config");

const pool = new Pool({
  host: DB_HOST,
  port: Number(DB_PORT),
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;
