CREATE TABLE IF NOT EXISTS "sessions" (
    "id"                   UUID        NOT NULL DEFAULT gen_random_uuid(),
    "user_id"              TEXT        NOT NULL,
    "email"                TEXT        NOT NULL,
    "created_at"           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_at"       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "absolute_expires_at"  TIMESTAMPTZ NOT NULL,
    "invalidated_at"       TIMESTAMPTZ,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_sessions_active" ON "sessions"("id") WHERE "invalidated_at" IS NULL;
