const axios = require('axios');

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Minimal cache - 5 seconds only
const cache = {
  data: null,
  timestamp: 0,
  TTL: 5000 // 5 seconds only
};

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Check 5-second cache only
    if (cache.data && Date.now() - cache.timestamp < cache.TTL) {
      return res.status(200).json(cache.data);
    }

    const symbols = [
      { name: 'NIFTY 50', symbol: 'NIFTY50' },
      { name: 'BANKNIFTY', symbol: 'BANKNIFTY' },
      { name: 'FINNIFTY', symbol: 'FINNIFTY' }
    ];

    const indicesData = await Promise.all(
      symbols.map(async (sym) => {
        try {
          const response = await axios.get(
            `https://finnhub.io/api/v1/quote`,
            {
              params: {
                symbol: `${sym.symbol}:IN`,
                token: FINNHUB_API_KEY
              },
              timeout: 5000
            }
          );

          return {
            name: sym.name,
            symbol: sym.symbol,
            last: response.data.c || 0,
            change: response.data.d || 0,
            percentChange: response.data.dp || 0,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          console.error(`Error fetching ${sym.symbol}:`, error.message);
          return {
            name: sym.name,
            symbol: sym.symbol,
            last: 0,
            change: 0,
            percentChange: 0,
            error: 'API Error'
          };
        }
      })
    );

    cache.data = indicesData;
    cache.timestamp = Date.now();

    res.status(200).json(indicesData);
  } catch (error) {
    console.error('Error in /api/indices:', error.message);
    res.status(500).json({ error: 'Failed to fetch indices data' });
  }
};
