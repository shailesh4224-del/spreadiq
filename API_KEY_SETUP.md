# Get free API keys from these providers:

## Option 1: Twelvedata (RECOMMENDED)
URL: https://twelvedata.com/
- Free tier: 800 API calls/day
- Real-time Indian market data
- NIFTY, BANKNIFTY, FINNIFTY support
- No CORS issues

Steps:
1. Visit https://twelvedata.com/
2. Sign up (free account)
3. Go to Dashboard → API Keys
4. Copy your API key
5. Add to Vercel: TWELVEDATA_API_KEY=your_key

## Option 2: Finnhub
URL: https://finnhub.io/
- Free tier: 60 API calls/min
- Limited Indian data (delayed)

## Option 3: Alpha Vantage
URL: https://www.alphavantage.co/
- Free tier: 5 API calls/min
- Good for US stocks
- Limited Indian coverage

## Option 4: Polygon.io
URL: https://polygon.io/
- Free tier available
- Limited Indian data

## Option 5: Rapid API (Multiple providers)
URL: https://rapidapi.com/
- Multiple data providers
- Indian market data available
- Pay-as-you-go or subscriptions

## Recommended Setup:
1. Use Twelvedata for indices (NIFTY, BANKNIFTY, FINNIFTY)
2. Keep NSE API for option chain (use server-side proxy)
3. Add fallback to other APIs if needed
