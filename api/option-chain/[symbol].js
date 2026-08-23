const axios = require('axios');

const NSE_API_BASE = 'https://www.nseindia.com/api';

// Cache only 5 seconds for live data
const cache = {};
const CACHE_TTL = 5000; // 5 seconds

const fetchNSEOptionChain = async (symbol) => {
  try {
    // Check 5-second cache
    if (cache[symbol] && Date.now() - cache[symbol].timestamp < CACHE_TTL) {
      return cache[symbol].data;
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Referer': 'https://www.nseindia.com/'
    };

    console.log(`Fetching option chain for ${symbol}...`);

    const response = await axios.get(
      `${NSE_API_BASE}/option-chain-indices?index=${symbol}`,
      { headers, timeout: 15000 }
    );

    const data = response.data;

    if (!data.records || !data.records.data) {
      throw new Error('Invalid response structure from NSE');
    }

    const currentExpiry = data.records.expiryDates && data.records.expiryDates[0];
    if (!currentExpiry) {
      throw new Error('No expiry dates found');
    }

    const records = data.records.data.filter(r => r.expiryDate === currentExpiry);
    const spot = data.records.underlyingValue || 0;
    const atmStrike = Math.round(spot / 100) * 100;

    const chain = records
      .map(record => {
        const isCall = record.symbol && record.symbol.includes('CE');
        return {
          strike: record.strikePrice,
          type: isCall ? 'CE' : 'PE',
          ltp: record.lastPrice || 0,
          bid: record.bidprice || 0,
          ask: record.askprice || 0,
          volume: record.totalTradedVolume || 0,
          oi: record.openInterest || 0,
          iv: record.impliedVolatility || 0
        };
      })
      .filter(opt => opt.ltp > 0);

    const result = {
      symbol,
      spot,
      atmStrike,
      currentExpiry,
      chain,
      timestamp: new Date().toISOString()
    };

    if (!cache[symbol]) cache[symbol] = {};
    cache[symbol].data = result;
    cache[symbol].timestamp = Date.now();

    return result;
  } catch (error) {
    console.error(`NSE Fetch Error for ${symbol}:`, error.message);
    throw new Error(`Failed to fetch option chain: ${error.message}`);
  }
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
    const { symbol } = req.query;

    if (!symbol || !['NIFTY', 'BANKNIFTY', 'FINNIFTY'].includes(symbol.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid symbol. Use: NIFTY, BANKNIFTY, or FINNIFTY' });
    }

    const optionData = await fetchNSEOptionChain(symbol.toUpperCase());
    res.status(200).json(optionData);
  } catch (error) {
    console.error('Error in /api/option-chain:', error.message);
    
    // Return detailed error message
    res.status(500).json({ 
      error: 'NSE API temporarily unavailable',
      message: error.message,
      suggestion: 'Market might be closed. Try during 9 AM - 4 PM IST'
    });
  }
};
