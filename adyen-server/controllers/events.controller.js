const pool = require("../db");
const sessionBus = require("../events/sessionBus");
const { IDLE_TIMEOUT_MINUTES } = require("../config");

const IDLE_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;

const sessionExpiry = async (req, res) => {
  const sid = req.cookies?.sid;
  if (!sid) return res.status(401).end();

  const { rows } = await pool.query(
    `SELECT last_active_at, absolute_expires_at
     FROM sessions
     WHERE id = $1 AND invalidated_at IS NULL`,
    [sid]
  );

  if (!rows.length) return res.status(401).end();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const absoluteExpiresAt = new Date(rows[0].absolute_expires_at).getTime();

  let idleTimer = null;

  function expire() {
    clearTimeout(idleTimer);
    sessionBus.off(`heartbeat:${sid}`, onHeartbeat);
    res.write("event: session-expired\ndata: {}\n\n");
    res.end();
  }

  function scheduleIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(expire, IDLE_MS);
  }

  function onHeartbeat() {
    scheduleIdleTimer();
  }

  // Schedule absolute expiry
  const msUntilAbsolute = absoluteExpiresAt - Date.now();
  const absoluteTimer = setTimeout(expire, msUntilAbsolute);

  // Start idle timer and listen for heartbeats to reset it
  sessionBus.on(`heartbeat:${sid}`, onHeartbeat);
  scheduleIdleTimer();

  req.on("close", () => {
    clearTimeout(idleTimer);
    clearTimeout(absoluteTimer);
    sessionBus.off(`heartbeat:${sid}`, onHeartbeat);
  });
};

module.exports = { sessionExpiry };
