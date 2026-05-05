const pool = require("../db");

const sessionExpiry = async (req, res) => {
  const sid = req.cookies?.sid;
  if (!sid) return res.status(401).end();

  const { rows } = await pool.query(
    `SELECT expires_at FROM sessions WHERE id = $1 AND invalidated_at IS NULL AND expires_at > now()`,
    [sid]
  );

  if (!rows.length) return res.status(401).end();

  const msUntilExpiry = new Date(rows[0].expires_at).getTime() - Date.now();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const timer = setTimeout(() => {
    res.write("event: session-expired\ndata: {}\n\n");
    res.end();
  }, msUntilExpiry);

  req.on("close", () => clearTimeout(timer));
};

module.exports = { sessionExpiry };
