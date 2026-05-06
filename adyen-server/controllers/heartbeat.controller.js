const pool = require("../db");
const { IDLE_TIMEOUT_MINUTES } = require("../config");

const heartbeat = async (req, res) => {
  const sid = req.cookies?.sid;
  if (!sid) return res.status(401).json({ error: "No active session" });

  console.log(`[Heartbeat] Received for session ${sid} — updating last_active_at`);

  // RETURNING last_active_at so idleExpiresAt is derived from DB clock, not Node clock
  const { rows } = await pool
    .query(`UPDATE sessions SET last_active_at = now() WHERE id = $1 RETURNING last_active_at, absolute_expires_at`, [sid])
    .catch((err) => { console.error("[Heartbeat] DB update failed:", err); return { rows: [] }; });

  if (!rows.length) return res.status(401).json({ error: "Session not found" });

  const { last_active_at, absolute_expires_at } = rows[0];
  const idleExpiresAt = new Date(new Date(last_active_at).getTime() + IDLE_TIMEOUT_MINUTES * 60 * 1000);

  console.log(`[Heartbeat] DB updated — idleExpiresAt: ${idleExpiresAt.toISOString()}, absoluteExpiresAt: ${new Date(absolute_expires_at).toISOString()}`);

  res.json({
    ok:                true,
    idleExpiresAt:     idleExpiresAt.toISOString(),
    absoluteExpiresAt: new Date(absolute_expires_at).toISOString(),
  });
};

module.exports = { heartbeat };
