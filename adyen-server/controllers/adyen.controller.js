const { Client, Config, CheckoutAPI } = require("@adyen/api-library");
const { v4: uuid } = require("uuid");
const {
  ADYEN_API_KEY,
  ADYEN_ENVIRONMENT,
  ADYEN_MERCHANT_ACCOUNT,
} = require("../config");
const { payment } = require("@adyen/api-library/lib/src/typings");

// Initialize Adyen client
const adyenConfig = new Config();
adyenConfig.apiKey = ADYEN_API_KEY;
adyenConfig.environment = ADYEN_ENVIRONMENT;

const client = new Client(adyenConfig);

const checkout = new CheckoutAPI(client);

// In-memory store for payment statuses (keyed by orderRef)
const paymentStatuses = new Map();

/**
 * POST /api/sessions
 * Creates an Adyen checkout session for Drop-in
 */
const createSession = async (req, res) => {
  try {
    const { amount = 1000, currency = "GBP", countryCode = "GB" } = req.body;
    const orderRef = uuid();

    const sessionRequest = {
      amount: { currency, value: amount },
      countryCode,
      merchantAccount: ADYEN_MERCHANT_ACCOUNT,
      reference: orderRef,
      returnUrl: `http://localhost:5173/checkout?orderRef=${orderRef}`,
    };

    const response = await checkout.PaymentsApi.sessions(sessionRequest);

    // Initialize status as pending
    paymentStatuses.set(orderRef, { status: "pending" });

    res.json({
      id: response.id,
      sessionData: response.sessionData,
      orderRef,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/webhooks
 * Handles Adyen webhook notifications
 */
const handleWebhook = async (req, res) => {
  const notificationItems =
    req.body?.notificationItems || req.body?.NotificationRequestItem;

  if (!notificationItems) {
    console.warn("Webhook received with no notification items");
    return res.json({ notificationResponse: "[accepted]" });
  }

  for (const item of notificationItems) {
    const notification = item.NotificationRequestItem;
    const orderRef = notification.merchantReference;

    console.log("Webhook received:", {
      eventCode: notification.eventCode,
      pspReference: notification.pspReference,
      merchantReference: orderRef,
      success: notification.success,
      paymentMethod: notification.paymentMethod,
    });

    if (notification.eventCode === "AUTHORISATION") {
      const status = notification.success === "true" ? "success" : "failed";
      paymentStatuses.set(orderRef, {
        status,
        pspReference: notification.pspReference,
        paymentMethod: notification.paymentMethod,
        eventCode: notification.eventCode,
      });
      console.log(`[Webhook] Order ${orderRef} updated to: ${status}`);
    }
  }

  // Always respond with [accepted] to acknowledge receipt
  res.json({ notificationResponse: "[accepted]" });
};

module.exports = {
  createSession,
  handleWebhook,
};
