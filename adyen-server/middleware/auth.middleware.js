const pool = require("../db");
const { IDLE_TIMEOUT_MINUTES } = require("../config");

async function requireSession(req, res, next) {
  const sid = req.cookies?.sid;
  if (!sid) {
    return res.status(401).json({ error: "No active session" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, email, last_active_at, absolute_expires_at
       FROM sessions
       WHERE id = $1
         AND invalidated_at IS NULL
         AND now() - last_active_at < INTERVAL '${IDLE_TIMEOUT_MINUTES} minutes'
         AND now() < absolute_expires_at`,
      [sid]
    );

    if (!rows.length) {
      return res.status(401).json({ error: "Session expired or invalid" });
    }

    req.session = rows[0];
    next();
  } catch (err) {
    console.error("Session validation error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = requireSession;
