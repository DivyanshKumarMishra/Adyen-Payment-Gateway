const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";
const ADYEN_ENVIRONMENT = process.env.ADYEN_ENVIRONMENT;
const ADYEN_API_KEY = process.env.ADYEN_API_KEY;
const ADYEN_HMAC_KEY = process.env.ADYEN_HMAC_KEY;
const ADYEN_MERCHANT_ACCOUNT = process.env.ADYEN_MERCHANT_ACCOUNT;
const ADYEN_CLIENT_KEY = process.env.ADYEN_CLIENT_KEY;

// PostgreSQL
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT || 5432;
const DB_NAME = process.env.DB_NAME || "postgres";
const DB_USER = process.env.DB_USER || "postgres";
const DB_PASSWORD = process.env.DB_PASSWORD;

// Firebase Admin
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;

const IDLE_TIMEOUT_MINUTES = 10;
const ABSOLUTE_MAX_HOURS = 1;

module.exports = {
  PORT,
  HOST,
  ADYEN_ENVIRONMENT,
  ADYEN_API_KEY,
  ADYEN_HMAC_KEY,
  ADYEN_MERCHANT_ACCOUNT,
  ADYEN_CLIENT_KEY,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  IDLE_TIMEOUT_MINUTES,
  ABSOLUTE_MAX_HOURS,
};
