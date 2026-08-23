# SpreadIQ Backend

Node.js/Express backend server for SpreadIQ live options analytics dashboard.

## Features

- ✅ **Live NSE Option Chain Data** - Real-time calls, puts, OI, volume
- ✅ **Market Indices** - NIFTY, BANKNIFTY, FINNIFTY prices
- ✅ **Smart Caching** - 1-minute cache to avoid API rate limits
- ✅ **CORS Enabled** - Frontend integration ready
- ✅ **Error Handling** - Graceful fallbacks for API failures

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Get a **free Finnhub API key** from https://finnhub.io/
2. Create `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

3. Add your Finnhub API key:

```env
FINNHUB_API_KEY=your_api_key_here
PORT=5000
```

## Running the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server runs on `http://localhost:5000`

## API Endpoints

### 1. Get Live Indices
```
GET /api/indices
```

**Response:**
```json
[
  {
    "name": "NIFTY 50",
    "symbol": "NIFTY50",
    "last": 18500.25,
    "change": 150.50,
    "percentChange": 0.82,
    "timestamp": "2026-08-23T10:30:00Z"
  }
]
```

### 2. Get Option Chain
```
GET /api/option-chain/:symbol
```

**Params:** `NIFTY`, `BANKNIFTY`, `FINNIFTY`

**Response:**
```json
{
  "symbol": "NIFTY",
  "spot": 18500.25,
  "atmStrike": 18500,
  "currentExpiry": "26-AUG-2026",
  "chain": [
    {
      "strike": 18400,
      "type": "CE",
      "ltp": 125.50,
      "volume": 5000,
      "oi": 250000,
      "iv": 15.5
    }
  ],
  "timestamp": "2026-08-23T10:30:00Z"
}
```

### 3. Health Check
```
GET /health
```

## Deployment

### Heroku
```bash
heroku create your-app-name
git push heroku main
```

### Vercel/Netlify
Use serverless functions or proxy to external backend.

### Local/VPS
```bash
npm start
```

## Frontend Integration

Update your frontend API calls:

```javascript
const API_BASE = 'http://localhost:5000';

// Indices
fetch(`${API_BASE}/api/indices`).then(r => r.json())

// Option Chain
fetch(`${API_BASE}/api/option-chain/NIFTY`).then(r => r.json())
```

## Security Notes

⚠️ **Important:**
- Never commit `.env` file to Git
- Keep Finnhub API key private
- Use environment variables in production
- Implement rate limiting for production use

## Troubleshooting

**"Failed to fetch indices"**
- Check Finnhub API key is valid
- Verify internet connection
- Check API rate limits (free tier: 60 calls/min)

**"Failed to fetch option chain"**
- NSE API may be down during market hours
- Check if symbol is valid (NIFTY, BANKNIFTY, FINNIFTY)
- Review NSE website for data availability

## Dependencies

- **express** - Web framework
- **axios** - HTTP client
- **cors** - Enable cross-origin requests
- **dotenv** - Environment variables

## License

MIT © SpreadIQ
