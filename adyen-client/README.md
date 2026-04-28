# Adyen PoC - Client

React + TypeScript + Vite frontend for the Adyen payment integration PoC. Uses Adyen Web Drop-in (v6) with the Sessions flow.

## Setup

```bash
npm install
cp .env.sample .env
# Fill in VITE_ADYEN_CLIENT_KEY and VITE_API_URL
```

## Run

```bash
npm run dev
```

The client runs on `http://localhost:5173` by default.

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_ADYEN_CLIENT_KEY` | Adyen client key (public, starts with `test_` or `live_`) |
| `VITE_API_URL` | Backend API URL (e.g. `http://localhost:3000/api`) |

## Project Structure

```
src/
├── App.tsx
├── main.tsx
├── data/
│   └── products.ts          # Product list with prices in GBP
└── components/
    ├── Checkout/
    │   └── Checkout.tsx      # Adyen Drop-in integration
    └── ProductGrid/
        ├── ProductGrid.tsx   # Responsive product grid
        └── ProductGrid.css
```

## Flow

1. User browses the product grid
2. Clicks "Buy Now" on a product
3. Client calls `POST /api/adyen/sessions` with the product amount/currency
4. Adyen Drop-in renders with the session data
5. User enters card details and submits payment
6. On success (`Authorised`/`Received`) — shows success screen
7. On failure (`Refused`/`Error`) — shows failure screen
8. Webhook handles server-side order status update separately

## Test Card Details

### Visa
| Number | Expiry | CVC | Notes |
|---|---|---|---|
| `4111 1111 1111 1111` | `03/30` | `737` | Basic test card |
| `4111 1111 4555 1142` | `03/30` | `737` | Alternate test card |
| `4444 3333 2222 1111` | `03/30` | `737` | Alternate test card |

### Mastercard
| Number | Expiry | CVC | Notes |
|---|---|---|---|
| `5555 5555 5555 4444` | `03/30` | `737` | Basic test card |
| `5555 4444 3333 1111` | `03/30` | `737` | Alternate test card |
| `2222 4000 7000 0005` | `03/30` | `737` | Alternate test card |

### American Express
| Number | Expiry | CVC | Notes |
|---|---|---|---|
| `3700 0000 0000 002` | `03/30` | `7373` | CVC is 4 digits for Amex |
| `3700 0000 0100 018` | `03/30` | `7373` | Alternate test card |

### JCB
| Number | Expiry | CVC | Notes |
|---|---|---|---|
| `3569 9900 1009 5841` | `03/30` | `737` | Basic test card |

### China UnionPay (CUP)
| Number | Expiry | CVC | Notes |
|---|---|---|---|
| `6212 3456 7890 1232` | `03/30` | `737` | Basic test card |

### 3DS2 (3D Secure)
| Number | Expiry | CVC | Notes |
|---|---|---|---|
| `4212 3456 7891 0006` | `03/30` | `737` | 3DS2 challenge, password: `password`|
