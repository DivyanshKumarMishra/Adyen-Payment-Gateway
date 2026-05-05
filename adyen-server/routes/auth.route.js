const express = require("express");
const { login, logout, me } = require("../controllers/auth.controller");
const { sessionExpiry } = require("../controllers/events.controller");
const { heartbeat } = require("../controllers/heartbeat.controller");
const requireSession = require("../middleware/auth.middleware");

const authRouter = express.Router();

authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireSession, me);
authRouter.post("/heartbeat", requireSession, heartbeat);
authRouter.get("/events/session-expired", sessionExpiry);

module.exports = authRouter;
