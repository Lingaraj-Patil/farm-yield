# FarmYield - Implementation Updates

## Completed Features

### 1. ✅ Helius Webhooks for Real-Time Transaction Updates

**Backend Changes:**
- Created [routes/webhooks.js](backend/routes/webhooks.js) with:
  - `POST /api/webhooks/helius` - Webhook receiver endpoint
  - `POST /api/webhooks/helius/register` - Register webhooks via API
  - Transaction type detection (mint_cnft, reward, vote, badge, unknown)
  - Automatic transaction status updates (confirmed/failed)
- Updated [services/helius.js](backend/services/helius.js):
  - Added optional `authHeader` support for webhook security
  - Uses `HELIUS_WEBHOOK_AUTH_TOKEN` for authentication
- Updated [models/Transaction.js](backend/models/Transaction.js):
  - Added 'unknown' type for unrecognized transactions
- Updated [server.js](backend/server.js):
  - Mounted webhook routes at `/api/webhooks`

**Configuration:**
- Added to [.env.example](backend/.env.example):
  - `HELIUS_WEBHOOK_AUTH_TOKEN` - Optional security token

### 2. ✅ Vote Transactions with txSignature Storage

**Backend Changes:**
- Updated [routes/reports.js](routes/reports.js):
  - Added `Vote` model import
  - Modified `POST /:id/vote` endpoint to:
    - Accept optional `txSignature` in request body
    - Store vote records in `Vote` collection
    - Create/update `Transaction` record when signature provided
    - Link transaction to report and voter wallet
- Updated [models/Vote.js](models/Vote.js):
  - Already had `txSignature` field (String, optional)
  - Prevents duplicate votes per report+wallet

**Usage:**
```javascript
POST /api/reports/:id/vote
{
  "voteType": "approve",
  "comment": "Looks legitimate",
  "txSignature": "5xY3z..." // optional on-chain tx
}
```

### 3. ✅ JWT Authentication with Signature Flow

**Backend Changes:**
- Updated [middleware/auth.js](backend/middleware/auth.js):
  - Added JWT support with fallback to wallet header
  - Checks `Authorization: Bearer <token>` header first
  - Falls back to `x-wallet-address` header
- Updated [models/User.js](backend/models/User.js):
  - Added `authNonce` and `authNonceIssuedAt` fields for challenge-response
- Updated [routes/auth.js](backend/routes/auth.js):
  - `POST /api/auth/challenge` - Request authentication challenge
  - `POST /api/auth/verify` - Verify signature and issue JWT
  - 10-minute nonce TTL
  - Signature verification using tweetnacl
- Added `jsonwebtoken` to [package.json](backend/package.json)

**Configuration:**
- Added to [.env.example](backend/.env.example):
  - `JWT_SECRET` - Secret key for signing tokens
  - `JWT_EXPIRES_IN` - Token expiration (default: 7d)

**Frontend Changes:**
- Created [utils/authJWT.js](frontend/src/utils/authJWT.js):
  - Token storage utilities (localStorage)
  - `requestChallenge()` - Get authentication challenge
  - `verifyAndLogin()` - Verify signature and receive token
  - `signMessage()` - Sign challenge with wallet
- Updated [utils/api.js](frontend/src/utils/api.js):
  - Added axios interceptor to attach JWT token to requests
  - Prioritizes JWT over wallet header
- Updated [components/WalletConnect.jsx](frontend/src/components/WalletConnect.jsx):
  - Performs signature-based auth on wallet connect
  - Shows "Authenticating..." indicator
  - Stores JWT token on successful verification
  - Falls back to simple wallet auth if signing not supported
- Added `axios` and `bs58` to [frontend/package.json](frontend/package.json)

**Authentication Flow:**
1. User connects wallet
2. Frontend requests challenge from `/api/auth/challenge`
3. User signs challenge message with their wallet
4. Frontend sends signature to `/api/auth/verify`
5. Backend verifies signature and issues JWT token
6. Token stored in localStorage and used for subsequent requests

### 4. ✅ Offline Queue Panel UI

**Frontend Changes:**
- Created [components/OfflineQueuePanel.jsx](frontend/src/components/OfflineQueuePanel.jsx):
  - Displays pending offline reports
  - Shows report details (crop, quantity, location)
  - "Sync Now" button to manually process queue
  - "Delete" button for individual reports
  - Auto-refreshes every 5 seconds
  - Hidden when queue is empty
- Updated [components/LandingPage.jsx](frontend/src/components/LandingPage.jsx):
  - Imported and displays `OfflineQueuePanel` at the top
  - Visible to all users (not just on report form)

**Features:**
- Visual indicator with yellow theme (offline status)
- Real-time queue count
- Sync button disabled when offline
- Loading spinner during sync
- Confirmation before deleting

## Testing Guide

### 1. Test Helius Webhooks

**Setup:**
```bash
# Set in backend/.env
HELIUS_API_KEY=your_api_key
HELIUS_WEBHOOK_AUTH_TOKEN=your_secret_token
PUBLIC_BASE_URL=https://your-domain.com
```

**Register Webhook:**
```bash
POST /api/webhooks/helius/register
{
  "accountAddresses": ["your_treasury_wallet_address"],
  "transactionTypes": ["Any"]
}
```

**Test Webhook Receiver:**
```bash
POST /api/webhooks/helius
Authorization: Bearer your_secret_token
[
  {
    "signature": "tx_signature",
    "type": "TRANSFER",
    "nativeTransfers": [{
      "fromUserAccount": "wallet1",
      "toUserAccount": "wallet2",
      "amount": 10000000
    }],
    "timestamp": 1234567890
  }
]
```

### 2. Test Vote Transaction Storage

**Submit Vote with Transaction:**
```bash
POST /api/reports/:reportId/vote
x-wallet-address: your_wallet

{
  "voteType": "approve",
  "comment": "Verified in person",
  "txSignature": "5xY3zAbc..."
}
```

**Verify Storage:**
- Check `votes` collection for vote record
- Check `transactions` collection for transaction record with type='vote'

### 3. Test JWT Authentication

**Get Challenge:**
```bash
POST /api/auth/challenge
{
  "walletAddress": "your_wallet_address"
}
```

**Response:**
```json
{
  "success": true,
  "message": "FarmYield Authentication\nWallet: ...\nNonce: ...\nIssuedAt: ...",
  "nonce": "abc123...",
  "issuedAt": "2026-02-09T..."
}
```

**Sign Message & Verify:**
```bash
POST /api/auth/verify
{
  "walletAddress": "your_wallet_address",
  "signature": "base58_encoded_signature",
  "message": "same_message_from_challenge"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Use Token:**
```bash
GET /api/auth/profile/:walletAddress
Authorization: Bearer your_jwt_token
```

### 4. Test Offline Queue UI

**Steps:**
1. Open frontend in browser
2. Connect wallet
3. Disconnect network (offline mode)
4. Submit a crop report
5. Should see "Report saved and will be submitted automatically when online"
6. Navigate to home page
7. Should see yellow "Offline Queue" panel with 1 pending report
8. Reconnect network
9. Click "Sync Now" button
10. Report should be submitted and panel should disappear

## Environment Variables Required

### Backend
```env
JWT_SECRET=your_256_bit_secret
JWT_EXPIRES_IN=7d
HELIUS_WEBHOOK_AUTH_TOKEN=your_webhook_secret
```

### Frontend
No additional env vars needed (axios and bs58 work out of the box)

## API Documentation

### New Endpoints

#### POST /api/auth/challenge
Request an authentication challenge.
```json
Request: { "walletAddress": "string" }
Response: { "success": true, "message": "string", "nonce": "string", "issuedAt": "string" }
```

#### POST /api/auth/verify
Verify signature and receive JWT token.
```json
Request: { "walletAddress": "string", "signature": "string", "message": "string" }
Response: { "success": true, "token": "string", "user": {...} }
```

#### POST /api/webhooks/helius
Receive Helius webhook events (expects Authorization header).
```json
Request: [{ "signature": "string", "type": "string", ... }]
Response: { "success": true, "processed": number }
```

#### POST /api/webhooks/helius/register
Register a new webhook with Helius.
```json
Request: { "accountAddresses": ["string"], "transactionTypes": ["string"] }
Response: { "success": true, "webhook": {...} }
```

## Migration Notes

### Database
No migration required - new fields have defaults:
- `User.authNonce`: null
- `User.authNonceIssuedAt`: null
- `Vote.txSignature`: optional
- `Transaction.type`: can now be 'unknown'

### Backward Compatibility
- All endpoints work with both JWT tokens and wallet headers
- Existing wallet-only auth flow still works
- Vote endpoint works with or without txSignature
- Offline queue is purely frontend-based (IndexedDB)

## Security Considerations

1. **JWT Secret**: Must be strong 256-bit key in production
2. **Webhook Auth**: Use `HELIUS_WEBHOOK_AUTH_TOKEN` to prevent unauthorized webhook calls
3. **Nonce TTL**: 10-minute expiration prevents replay attacks
4. **Token Expiration**: Default 7 days, configurable via `JWT_EXPIRES_IN`
5. **Signature Verification**: Uses ed25519 cryptographic signatures

## Next Steps

1. Configure environment variables in production
2. Register Helius webhooks for treasury wallet
3. Test end-to-end authentication flow
4. Monitor webhook endpoint for incoming transactions
5. Consider adding refresh token mechanism for long-lived sessions
