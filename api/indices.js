const axios = require('axios');

// Using Twelvedata API - Works perfectly for Indian stocks!
const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY || 'demo';
const TWELVEDATA_BASE = 'https://api.twelvedata.com';

// Cache only 5 seconds for live data
const cache = {
  data: null,
  timestamp: 0,
  TTL: 5000
};

const symbolMap = {
  'NIFTY50': '^NSEI',
  'BANKNIFTY': '^NSEBANK',
  'FINNIFTY': '^NSEFINANCE'
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
    // Check cache
    if (cache.data && Date.now() - cache.timestamp < cache.TTL) {
      return res.status(200).json(cache.data);
    }

    const symbols = Object.values(symbolMap).join(',');
    const response = await axios.get(
      `${TWELVEDATA_BASE}/quote`,
      {
        params: {
          symbol: symbols,
          apikey: TWELVEDATA_API_KEY
        },
        timeout: 10000
      }
    );

    const quotesData = response.data.data || [];

    const indicesData = [
      {
        name: 'NIFTY 50',
        symbol: 'NIFTY50',
        last: parseFloat(quotesData.find(q => q.symbol === '^NSEI')?.close) || 0,
        change: parseFloat(quotesData.find(q => q.symbol === '^NSEI')?.change) || 0,
        percentChange: parseFloat(quotesData.find(q => q.symbol === '^NSEI')?.percent_change) || 0,
        timestamp: new Date().toISOString()
      },
      {
        name: 'BANKNIFTY',
        symbol: 'BANKNIFTY',
        last: parseFloat(quotesData.find(q => q.symbol === '^NSEBANK')?.close) || 0,
        change: parseFloat(quotesData.find(q => q.symbol === '^NSEBANK')?.change) || 0,
        percentChange: parseFloat(quotesData.find(q => q.symbol === '^NSEBANK')?.percent_change) || 0,
        timestamp: new Date().toISOString()
      },
      {
        name: 'FINNIFTY',
        symbol: 'FINNIFTY',
        last: parseFloat(quotesData.find(q => q.symbol === '^NSEFINANCE')?.close) || 0,
        change: parseFloat(quotesData.find(q => q.symbol === '^NSEFINANCE')?.change) || 0,
        percentChange: parseFloat(quotesData.find(q => q.symbol === '^NSEFINANCE')?.percent_change) || 0,
        timestamp: new Date().toISOString()
      }
    ];

    cache.data = indicesData;
    cache.timestamp = Date.now();

    res.status(200).json(indicesData);
  } catch (error) {
    console.error('Error fetching indices:', error.message);
    
    // Fallback
    const fallbackData = [
      { name: 'NIFTY 50', symbol: 'NIFTY50', last: 0, change: 0, percentChange: 0, timestamp: new Date().toISOString() },
      { name: 'BANKNIFTY', symbol: 'BANKNIFTY', last: 0, change: 0, percentChange: 0, timestamp: new Date().toISOString() },
      { name: 'FINNIFTY', symbol: 'FINNIFTY', last: 0, change: 0, percentChange: 0, timestamp: new Date().toISOString() }
    ];
    
    res.status(200).json(fallbackData);
  }
};
