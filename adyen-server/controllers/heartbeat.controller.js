const pool = require("../db");
const sessionBus = require("../events/sessionBus");

const heartbeat = async (req, res) => {
  const sid = req.cookies?.sid;
  if (!sid) return res.status(401).json({ error: "No active session" });

  await pool
    .query(`UPDATE sessions SET last_active_at = now() WHERE id = $1`, [sid])
    .catch(console.error);

  sessionBus.emit(`heartbeat:${sid}`);
  res.json({ ok: true });
};

module.exports = { heartbeat };
