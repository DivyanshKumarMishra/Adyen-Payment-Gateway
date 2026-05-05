const admin = require("../firebase/admin");
const pool = require("../db");
const { SESSION_MINUTES } = require("../config");

const login = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: "idToken is required" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email } = decoded;

    // const expiresAt = new Date(Date.now() + SESSION_MINUTES * 60 * 1000);
    const expiresAt = new Date(Date.now() + 30 * 1000);

    const { rows } = await pool.query(
      `INSERT INTO sessions (user_id, email, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [uid, email, expiresAt]
    );

    const sid = rows[0].id;

    res
      .cookie("sid", sid, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "prod",
        sameSite: "strict",
        // maxAge: SESSION_MINUTES * 60 * 1000,
        maxAge: 30 * 1000,
        path: "/",
      })
      .json({ user: { uid, email }, expiresAt });
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
  const { user_id: uid, email, expires_at } = req.session;
  res.json({ user: { uid, email }, expiresAt: expires_at });
};

module.exports = { login, logout, me };
