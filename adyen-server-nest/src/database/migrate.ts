import { Pool } from "pg";

export async function migrate(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id              TEXT        NOT NULL,
      email                TEXT        NOT NULL,
      created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_active_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
      absolute_expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
      invalidated_at       TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_active
      ON sessions(id)
      WHERE invalidated_at IS NULL;
  `);

  await pool.query(`
    ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS last_active_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
      ADD COLUMN IF NOT EXISTS absolute_expires_at TIMESTAMPTZ,
      DROP COLUMN IF EXISTS expires_at
  `);
  await pool.query(`
    UPDATE sessions SET absolute_expires_at = created_at + INTERVAL '1 hour' WHERE absolute_expires_at IS NULL
  `);
  await pool.query(`
    ALTER TABLE sessions
      ALTER COLUMN absolute_expires_at SET NOT NULL,
      ALTER COLUMN absolute_expires_at SET DEFAULT (now() + INTERVAL '1 hour')
  `);

  console.log("DB migration complete");
}
