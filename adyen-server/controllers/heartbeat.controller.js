const pool = require("../db");

const heartbeat = async (req, res) => {
  const sid = req.cookies?.sid;
  if (!sid) return res.status(401).json({ error: "No active session" });

  console.log(`[Heartbeat] Received for session ${sid.slice(0, 8)}… — updating last_active_at`);

  await pool
    .query(`UPDATE sessions SET last_active_at = now() WHERE id = $1`, [sid])
    .then(() => console.log(`[Heartbeat] DB updated for session ${sid.slice(0, 8)}…`))
    .catch((err) => console.error("[Heartbeat] DB update failed:", err));

  res.json({ ok: true });
};

module.exports = { heartbeat };
