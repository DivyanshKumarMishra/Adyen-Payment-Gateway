const express = require("express");
const { login, logout, me } = require("../controllers/auth.controller");
const requireSession = require("../middleware/auth.middleware");

const authRouter = express.Router();

authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireSession, me);

module.exports = authRouter;
