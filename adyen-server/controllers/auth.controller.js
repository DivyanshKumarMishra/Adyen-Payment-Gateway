const admin = require("../firebase/admin");
const pool = require("../db");
const { ABSOLUTE_MAX_HOURS, IDLE_TIMEOUT_MINUTES } = require("../config");

const login = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: "idToken is required" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email } = decoded;

    const absoluteExpiresAt = new Date(Date.now() + ABSOLUTE_MAX_HOURS * 60 * 60 * 1000);

    // RETURNING last_active_at so idleExpiresAt is derived from DB clock, not Node clock
    const { rows } = await pool.query(
      `INSERT INTO sessions (user_id, email, absolute_expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, last_active_at`,
      [uid, email, absoluteExpiresAt]
    );

    const { id: sid, last_active_at } = rows[0];
    const idleExpiresAt = new Date(new Date(last_active_at).getTime() + IDLE_TIMEOUT_MINUTES * 60 * 1000);

    res
      .cookie("sid", sid, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "prod",
        sameSite: "strict",
        maxAge: ABSOLUTE_MAX_HOURS * 60 * 60 * 1000,
        path: "/",
      })
      .json({
        user:              { uid, email },
        idleExpiresAt:     idleExpiresAt.toISOString(),
        absoluteExpiresAt: absoluteExpiresAt.toISOString(),
      });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(401).json({ error: "Invalid or expired Firebase token" });
  }
};

const logout = async (req, res) => {
  const sid = req.cookies?.sid;
  if (sid) {
    await pool
      .query(`UPDATE sessions SET invalidated_at = now() WHERE id = $1`, [sid])
      .catch(console.error);
  }
  res.clearCookie("sid", { path: "/" }).json({ ok: true });
};

const me = async (req, res) => {
  const { user_id: uid, email, last_active_at, absolute_expires_at } = req.session;

  // idleExpiresAt derived from DB's last_active_at — matches server validation logic exactly
  const idleExpiresAt = new Date(new Date(last_active_at).getTime() + IDLE_TIMEOUT_MINUTES * 60 * 1000);

  res.json({
    user:              { uid, email },
    idleExpiresAt:     idleExpiresAt.toISOString(),
    absoluteExpiresAt: new Date(absolute_expires_at).toISOString(),
  });
};

module.exports = { login, logout, me };
