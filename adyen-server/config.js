const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";
const ADYEN_ENVIRONMENT = process.env.ADYEN_ENVIRONMENT;
const ADYEN_API_KEY = process.env.ADYEN_API_KEY;
const ADYEN_HMAC_KEY = process.env.ADYEN_HMAC_KEY;
const ADYEN_MERCHANT_ACCOUNT = process.env.ADYEN_MERCHANT_ACCOUNT;
const ADYEN_CLIENT_KEY = process.env.ADYEN_CLIENT_KEY;

module.exports = {
  PORT,
  HOST,
  ADYEN_ENVIRONMENT,
  ADYEN_API_KEY,
  ADYEN_HMAC_KEY,
  ADYEN_MERCHANT_ACCOUNT,
  ADYEN_CLIENT_KEY,
};
