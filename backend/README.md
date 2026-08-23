# SpreadIQ Backend API

Serverless backend functions for SpreadIQ running on Vercel.

## No API Keys Needed! 🎉

This backend uses **100% free public APIs**:
- ✅ NSE API (National Stock Exchange)
- ✅ No authentication required
- ✅ Real-time market data
- ✅ No rate limits for personal use

## Quick Start

### Local Development

```bash
cd backend
npm install
npm run dev
```

Server runs on `http://localhost:3000`

### Deploy to Vercel

```bash
git add .
git commit -m "Deploy backend"
git push
```

Vercel auto-deploys from GitHub.

## API Endpoints

### 1. Live Indices

```
GET /api/indices
```

Returns live NIFTY, BANKNIFTY, FINNIFTY prices and changes.

**Cache:** 5 seconds  
**Updates:** Every 5 seconds  
**Source:** NSE API (Free)

### 2. Option Chain

```
GET /api/option-chain?symbol=NIFTY
```

Returns live option chain data for NSE indices.

**Symbols:** `NIFTY`, `BANKNIFTY`, `FINNIFTY`  
**Cache:** 5 seconds  
**Updates:** Every 5 seconds  
**Source:** NSE API (Free)

## Architecture

```
Vercel Serverless Functions
├── api/
│   ├── indices.js          (Live market indices)
│   └── option-chain/
│       └── [symbol].js     (Option chain by symbol)
└── public/
    └── dashboard.html      (Frontend)
```

## Environment Variables

**None needed!** This app uses free public APIs with no authentication.

## Performance

- Response time: ~1-2 seconds
- Cache: 5 seconds
- Total freshness: ~3-5 seconds
- Updates: 12 per minute
- Zero dependencies on paid APIs

## Data Sources

### NSE API
- **Endpoint:** `https://www.nseindia.com/api/`
- **Data:** Real-time option chains and indices
- **Free:** Yes, completely free
- **Rate Limit:** None for personal use
- **Auth:** None needed

## Troubleshooting

### "Failed to fetch indices"

**Cause:** NSE API is down or slow

**Fix:**
- Wait 30 seconds and refresh
- Check if it's 9 AM - 4 PM IST (market hours)
- Verify internet connection

### "Failed to fetch option chain"

**Cause:** NSE option chain API is temporarily down

**Fix:**
- Try after a few minutes
- Check market hours (9 AM - 4 PM IST)
- Verify symbol is correct (NIFTY, BANKNIFTY, FINNIFTY)

## CORS Configuration

All endpoints have CORS enabled for frontend access:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: *
```

## Caching Strategy

- **TTL:** 5 seconds (very aggressive for live data)
- **Headers:** `Cache-Control: no-cache, no-store, must-revalidate`
- **Browser Cache:** Disabled
- **Server Cache:** 5-second memory cache per symbol

## Rate Limiting

**No rate limits needed!**

- NSE APIs are free for personal use
- At 5-second refresh, you make:
  - 12 calls/min per endpoint
  - This is well within free tier usage

## Future Improvements

- [ ] Add WebSocket for true streaming
- [ ] Add historical data endpoints
- [ ] Add more indices (SENSEX, etc.)
- [ ] Add stock-specific data
- [ ] Add news/events integration

## License

MIT © SpreadIQ
