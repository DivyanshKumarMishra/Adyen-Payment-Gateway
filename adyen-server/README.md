# Adyen PoC - Server

Express.js backend for the Adyen payment integration PoC. Handles session creation and webhook notifications using the Adyen Node.js API library.

## Setup

```bash
npm install
cp .env.sample .env.dev
# Fill in your Adyen credentials
```

## Run

```bash
npm run dev          # loads .env.dev
npm run start:prod   # loads .env.prod
```

The server runs on `http://localhost:3000` by default.

## Environment Variables

| Variable | Description |
|---|---|
| `ADYEN_API_KEY` | Adyen API key (secret) |
| `ADYEN_MERCHANT_ACCOUNT` | Merchant account name |
| `ADYEN_CLIENT_KEY` | Adyen client key (public) |
| `ADYEN_ENVIRONMENT` | `test` or `live` |
| `ADYEN_HMAC_KEY` | HMAC key for webhook verification |
| `PORT` | Server port (default: `3000`) |
| `HOST` | Server host (default: `localhost`) |

## API Endpoints

### `POST /api/adyen/sessions`

Creates an Adyen checkout session for Drop-in.

**Request body:**
```json
{
  "amount": 1000,
  "currency": "GBP",
  "countryCode": "GB"
}
```

**Response:**
```json
{
  "id": "session-id",
  "sessionData": "session-data-string",
  "orderRef": "uuid"
}
```

### `POST /api/adyen/webhooks`

Receives Adyen webhook notifications. Updates payment status in-memory. Always responds with `[accepted]`.

## Project Structure

```
adyen-server/
├── index.js                        # Express app entry point
├── config.js                       # Environment variable exports
├── controllers/
│   └── adyen.controller.js         # Session creation & webhook handler
├── routes/
│   └── adyen.route.js              # API route definitions
├── .env.dev                        # Dev environment credentials
├── .env.sample                     # Template for new environments
└── package.json
```
