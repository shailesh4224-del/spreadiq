const express = require('express');
const axios = require('axios');

const app = express();

// Root route - serve landing page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static('public'));

// Helper function for Yahoo Finance
async function fetchYahoo(symbol) {
  try {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + symbol + '?interval=1d&range=1d';
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000
    });
    return response.data.chart.result[0].meta;
  } catch (err) {
    console.log('Yahoo error for ' + symbol + ':', err.message);
    return null;
  }
}

// ============= INDIAN INDICES =============
app.get('/api/indices', async (req, res) => {
  try {
    const symbols = [
      { name: 'NIFTY 50',   yahoo: '^NSEI' },
      { name: 'NIFTY BANK', yahoo: '^NSEBANK' },
      { name: 'SENSEX',     yahoo: '^BSESN' }
    ];
    const results = [];
    for (const sym of symbols) {
      const meta = await fetchYahoo(sym.yahoo);
      if (meta) {
        results.push({
          name: sym.name,
          last: meta.regularMarketPrice,
          change: meta.regularMarketPrice - meta.chartPreviousClose,
          percentChange: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100
        });
      }
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= MCX COMMODITIES =============
app.get('/api/mcx', async (req, res) => {
  try {
    // Use Yahoo Finance for now (international prices)
    const symbols = [
      { name: 'GOLD',      yahoo: 'GC=F' },
      { name: 'SILVER',    yahoo: 'SI=F' },
      { name: 'CRUDE OIL', yahoo: 'CL=F' }
    ];
    const results = [];
    for (const sym of symbols) {
      const meta = await fetchYahoo(sym.yahoo);
      if (meta) {
        // Convert USD to INR (approximate)
        const usdToInr = 83;
        const inrPrice = meta.regularMarketPrice * usdToInr;
        results.push({
          name: sym.name,
          last: inrPrice,
          change: (meta.regularMarketPrice - meta.chartPreviousClose) * usdToInr,
          percentChange: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100
        });
      }
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= MARKET DETAIL =============
app.get('/api/market-detail/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const yahooMap = {
      'NIFTY 50': '^NSEI',
      'NIFTY BANK': '^NSEBANK',
      'SENSEX': '^BSESN',
      'GOLD': 'GC=F',
      'SILVER': 'SI=F',
      'CRUDE OIL': 'CL=F'
    };
    
    const yahooSym = yahooMap[symbol];
    if (!yahooSym) return res.status(400).json({ error: 'Unknown symbol' });
    
    const meta = await fetchYahoo(yahooSym);
    if (!meta) return res.status(500).json({ error: 'Failed to fetch data' });
    
    const spot = meta.regularMarketPrice;
    const usdToInr = symbol.includes('GOLD') || symbol.includes('SILVER') || symbol.includes('CRUDE') ? 83 : 1;
    const spotInr = spot * usdToInr;
    
    let gap = 50;
    if (symbol === 'NIFTY BANK') gap = 100;
    if (symbol === 'SENSEX') gap = 100;
    if (symbol.includes('GOLD') || symbol.includes('SILVER') || symbol.includes('CRUDE')) gap = 10;
    
    const atmStrike = Math.round(spotInr / gap) * gap;
    
    const chain = [];
    const range = 10;
    
    for (let i = -range; i <= range; i++) {
      const strike = atmStrike + (i * gap);
      const moneyness = (strike - spotInr) / spotInr;
      const baseIV = symbol.includes('BANK') ? 18 : symbol.includes('SENSEX') ? 14 : 15;
      const iv = baseIV + Math.abs(moneyness) * 100;
      const callIntrinsic = Math.max(0, spotInr - strike);
      const putIntrinsic = Math.max(0, strike - spotInr);
      const timeValue = (iv / 100) * spotInr * Math.sqrt(7 / 365) * 0.4;
      
      const ceLtp = Math.max(0.05, callIntrinsic + timeValue * Math.exp(-Math.abs(i) * 0.15));
      const peLtp = Math.max(0.05, putIntrinsic + timeValue * Math.exp(-Math.abs(i) * 0.15));
      
      chain.push({ strike: strike, type: 'CE', ltp: ceLtp, iv: iv, oi: Math.floor(50000 * Math.exp(-Math.abs(i) * 0.3)), volume: Math.floor(50000 * Math.exp(-Math.abs(i) * 0.4) * 0.5), changeInOI: Math.floor((Math.random() - 0.5) * 10000) });
      chain.push({ strike: strike, type: 'PE', ltp: peLtp, iv: iv, oi: Math.floor(50000 * Math.exp(-Math.abs(i) * 0.3)), volume: Math.floor(50000 * Math.exp(-Math.abs(i) * 0.4) * 0.5), changeInOI: Math.floor((Math.random() - 0.5) * 10000) });
    }
    
    res.json({
      symbol: symbol,
      spot: spotInr,
      atmStrike: atmStrike,
      currentExpiry: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      chain: chain
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('SpreadIQ running on port ' + PORT);
});
