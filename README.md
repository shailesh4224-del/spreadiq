# 📊 SpreadIQ - Live NSE Options Analytics

**Real-time NSE option chain analysis with live indices streaming**

![Live Dashboard](https://img.shields.io/badge/Status-Live-green) ![API Status](https://img.shields.io/badge/API-Yahoo%20Finance-blue) ![Updates](https://img.shields.io/badge/Refresh-30s-orange)

## 🚀 Features

- ✅ **Live Option Chain Data** - Real-time calls, puts, OI, volume from Yahoo Finance
- ✅ **Live Market Indices** - NIFTY, BANKNIFTY, FINNIFTY streaming prices
- ✅ **30-Second Updates** - Auto-refresh with Yahoo Finance data
- ✅ **Strategy Calculators** - Butterfly, Iron Condor, Ratio Spreads, and more
- ✅ **PCR Ratio & Max Pain** - Calculated in real-time
- ✅ **Zero API Keys Needed** - Uses free Yahoo Finance public APIs
- ✅ **Smart Caching** - 5-second cache to optimize performance
- ✅ **CORS Enabled** - Frontend-backend integration ready

## 📱 Live Dashboard

Visit: **https://spreadiq.vercel.app/public/dashboard.html**

### Dashboard Features:
- 🔴 Blinking LIVE indicator
- 📊 Update counter (shows real-time refreshes)
- ⚡ Price flash animations
- ⏱️ HH:MM:SS timestamp updates
- 📈 Live option chain table
- 🎯 Strategy metrics

## 🛠️ Tech Stack

**Frontend:**
- Vanilla JavaScript (no frameworks)
- Tailwind CSS (responsive design)
- Real-time DOM updates

**Backend:**
- Node.js/Express (Vercel Serverless)
- Axios (HTTP requests)
- NSE API (free, no authentication)

## 📡 API Endpoints

### Get Live Indices
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

### Get Option Chain
```
GET /api/option-chain?symbol=NIFTY
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

## 🚀 Deployment

### Requirements
- Node.js 18+
- Vercel account (free)
- GitHub account

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Server runs on http://localhost:3000
```

### Deploy to Vercel

1. Push to GitHub:
```bash
git add .
git commit -m "Deploy SpreadIQ"
git push
```

2. Vercel auto-deploys when you push to GitHub

3. Visit your live dashboard:
```
https://spreadiq.vercel.app/public/dashboard.html
```

## 📊 Performance

| Metric | Value |
|--------|-------|
| Refresh Rate | 30 seconds |
| Cache TTL | 5 seconds |
| Updates/Min | 2 |
| Data Freshness | ~30 seconds |
| API Calls/Min | 6 (safe) |
| Dependencies | None (uses free APIs) |

## 🔧 Troubleshooting

### "Failed to fetch indices"
- NSE API might be down after market hours
- Check internet connection
- Try during 9 AM - 4 PM IST

### "Failed to fetch option chain"
- NSE option chain API is down
- Try again in a few minutes
- Check if market is open (9 AM - 4 PM IST)

### Updates not happening?
- Refresh page (Ctrl+R)
- Open browser console (F12) for errors
- Check if market hours (9 AM - 4 PM)

## 📚 Strategy Calculators

The dashboard includes these live strategy calculators:

1. **🦋 Butterfly Spread** - Limited risk/reward
2. **🦋 Skip Butterfly** - Modified ratio 1:3:2
3. **Wide Butterfly** - Wider strike selection
4. **🦋🦋 Double Butterfly** - Advanced strategy
5. **💓 Iron Condor** - 4-leg credit spread
6. **🦋💓 Iron Butterfly** - 4-leg credit spread
7. **📐 Ratio Spread** - 1:2 ratio strategy

## 📈 Market Data Sources

- **Yahoo Finance API** - Free market data for NSE indices and options
- **Real-time** - Updates every 30 seconds
- **No authentication** - Public APIs
- **No rate limits** - For personal use

## ⚠️ Legal Notice

- This is for educational and personal trading analysis only
- Not investment advice
- Use at your own risk
- Market data is real-time from NSE
- Always verify with official NSE website

## 🤝 Contributing

Fork the repository and submit PRs for improvements!

## 📄 License

MIT © SpreadIQ Contributors

## 📞 Support

For issues, create a GitHub issue or check the troubleshooting section.

---

**Built with ❤️ for Indian option traders**
