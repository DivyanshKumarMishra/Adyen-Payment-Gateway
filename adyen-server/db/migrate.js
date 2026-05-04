const pool = require("./index");

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id         TEXT        NOT NULL,
      email           TEXT        NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at      TIMESTAMPTZ NOT NULL,
      invalidated_at  TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_active
      ON sessions(id)
      WHERE invalidated_at IS NULL;
  `);

  console.log("DB migration complete");
}

module.exports = migrate;
