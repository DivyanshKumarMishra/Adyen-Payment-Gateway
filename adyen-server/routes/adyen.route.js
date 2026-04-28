const express = require("express");
const {
  createSession,
  handleWebhook,
} = require("../controllers/adyen.controller");

const adyenRouter = express.Router();

// Create a checkout session
adyenRouter.post("/sessions", createSession);

// Handle Adyen webhooks
adyenRouter.post("/webhooks", handleWebhook);

module.exports = adyenRouter;
