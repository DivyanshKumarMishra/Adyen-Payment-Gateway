export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || "localhost",

  adyen: {
    apiKey: process.env.ADYEN_API_KEY,
    environment: process.env.ADYEN_ENVIRONMENT || "test",
    merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
    hmacKey: process.env.ADYEN_HMAC_KEY,
    clientKey: process.env.ADYEN_CLIENT_KEY,
  },

  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || "postgres",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },

  // TEST VALUES — restore before production
  session: {
    idleTimeoutMinutes: 1,       // prod: 10
    absoluteMaxHours: 1 / 40,   // prod: 1
  },
});
