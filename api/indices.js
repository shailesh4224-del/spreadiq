const axios = require('axios');

// NSE API - Free, real-time, no API key needed!
const NSE_API_BASE = 'https://www.nseindia.com/api';

// Cache only 5 seconds for live data
const cache = {
  data: null,
  timestamp: 0,
  TTL: 5000 // 5 seconds
};

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Referer': 'https://www.nseindia.com/option-chain'
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
    // Check 5-second cache
    if (cache.data && Date.now() - cache.timestamp < cache.TTL) {
      return res.status(200).json(cache.data);
    }

    // Fetch indices from NSE - Real-time, FREE!
    const response = await axios.get(
      `${NSE_API_BASE}/allIndices`,
      { headers, timeout: 10000 }
    );

    const data = response.data.data;

    // Extract NIFTY, BANKNIFTY, FINNIFTY
    const indicesMap = {};
    data.forEach(item => {
      indicesMap[item.index] = item;
    });

    const indicesData = [
      {
        name: 'NIFTY 50',
        symbol: 'NIFTY50',
        last: parseFloat(indicesMap['NIFTY 50']?.lastPrice) || 0,
        change: parseFloat(indicesMap['NIFTY 50']?.change) || 0,
        percentChange: parseFloat(indicesMap['NIFTY 50']?.percentChange) || 0,
        timestamp: new Date().toISOString()
      },
      {
        name: 'BANKNIFTY',
        symbol: 'BANKNIFTY',
        last: parseFloat(indicesMap['NIFTY BANK']?.lastPrice) || 0,
        change: parseFloat(indicesMap['NIFTY BANK']?.change) || 0,
        percentChange: parseFloat(indicesMap['NIFTY BANK']?.percentChange) || 0,
        timestamp: new Date().toISOString()
      },
      {
        name: 'FINNIFTY',
        symbol: 'FINNIFTY',
        last: parseFloat(indicesMap['NIFTY FIN SERVICE']?.lastPrice) || 0,
        change: parseFloat(indicesMap['NIFTY FIN SERVICE']?.change) || 0,
        percentChange: parseFloat(indicesMap['NIFTY FIN SERVICE']?.percentChange) || 0,
        timestamp: new Date().toISOString()
      }
    ];

    // Update cache
    cache.data = indicesData;
    cache.timestamp = Date.now();

    res.status(200).json(indicesData);
  } catch (error) {
    console.error('Error fetching indices from NSE:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch indices data',
      message: error.message 
    });
  }
};
