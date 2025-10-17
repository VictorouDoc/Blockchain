# Backend Services - Oracle & Indexer

Backend services for the Real Estate Tokenization Platform.

## Services

### 1. Oracle Service (Port 3001)
Fetches and provides real-time price data:
- **XRP/USD** price from CoinGecko API
- **RES token** price based on property value
- Updates every 60 seconds

### 2. Indexer Service (Port 3002)
Monitors and indexes blockchain events:
- **KYC events** (Whitelisted, Blacklisted)
- **Transfer events** (RES token transfers)
- Syncs every 60 seconds

## Installation

```bash
cd backend
npm install
```

## Running Services

### Start Oracle only
```bash
npm run oracle
```

### Start Indexer only
```bash
npm run indexer
```

### Start both services (recommended)
```bash
npm run dev
```

## API Endpoints

### Oracle Service (http://localhost:3001)

#### GET /api/price/xrp
Returns current XRP/USD price

**Response:**
```json
{
  "success": true,
  "data": {
    "xrpUsd": 0.52,
    "lastUpdate": "2025-10-17T12:00:00.000Z",
    "source": "CoinGecko API"
  }
}
```

#### GET /api/price/res
Returns RES token price

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "RES",
    "name": "Real Estate Share",
    "price": {
      "usd": 500,
      "xrp": 961.54
    },
    "propertyValue": 500000,
    "totalShares": 1000,
    "lastUpdate": "2025-10-17T12:00:00.000Z"
  }
}
```

### Indexer Service (http://localhost:3002)

#### GET /api/events/kyc
Returns last 50 KYC events

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "type": "Whitelisted",
      "address": "0x5729471EE51FaEaF31fc093fd99E67f28429bf00",
      "blockNumber": 12345678,
      "transactionHash": "0xabc...",
      "timestamp": "2025-10-17T12:00:00.000Z"
    }
  ]
}
```

#### GET /api/events/transfers
Returns last 50 transfer events

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "from": "0x...",
      "to": "0x...",
      "value": "100.0",
      "blockNumber": 12345678,
      "transactionHash": "0xabc...",
      "timestamp": "2025-10-17T12:00:00.000Z"
    }
  ]
}
```

#### GET /api/stats
Returns blockchain statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "lastSyncedBlock": 12345678,
    "totalKYCEvents": 10,
    "totalTransfers": 5,
    "whitelisted": 8,
    "blacklisted": 2
  }
}
```

## Architecture

```
backend/
├── oracle.js       # XRP/USD price oracle
├── indexer.js      # Blockchain event indexer
├── package.json    # Dependencies
└── README.md       # This file
```

## Technologies

- **Express.js** - HTTP server
- **ethers.js** - Blockchain interaction
- **node-fetch** - API calls
- **CoinGecko API** - Price data source

## Notes

- Oracle updates every 60 seconds
- Indexer syncs every 60 seconds
- In-memory database (use Redis/PostgreSQL in production)
- Free CoinGecko API (50 calls/min limit)

## Production Considerations

1. Use a real database (PostgreSQL, MongoDB)
2. Add authentication/authorization
3. Implement rate limiting
4. Add logging (Winston, Pino)
5. Use environment variables for configuration
6. Deploy with PM2 or Docker
7. Add monitoring (Prometheus, Grafana)
