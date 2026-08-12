const express = require('express');
const axios = require('axios');

const app = express();

// Root route - serve landing page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static('public'));

// ============= INDICES (Yahoo Finance - FREE) =============
app.get('/api/indices', async (req, res) => {
  try {
    const symbols = ['^NSEI', '^NSEBANK', '^BSESN'];
    const results = [];
    for (const sym of symbols) {
      const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + sym + '?interval=1d&range=1d';
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      const meta = response.data.chart.result[0].meta;
      results.push({
        name: sym === '^NSEI' ? 'NIFTY 50' : sym === '^NSEBANK' ? 'NIFTY BANK' : 'SENSEX',
        last: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.chartPreviousClose,
        percentChange: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100
      });
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= OPTION CHAIN (Yahoo Finance approximation) =============
app.get('/api/option-chain/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Yahoo Finance symbols
    const yahooSymbols = {
      'NIFTY': '^NSEI',
      'BANKNIFTY': '^NSEBANK',
      'FINNIFTY': '^CNXIT'
    };
    
    const yahooSym = yahooSymbols[symbol];
    if (!yahooSym) {
      return res.status(400).json({ error: 'Symbol not supported' });
    }
    
    // Get spot price from Yahoo
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + yahooSym + '?interval=1d&range=1d';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const meta = response.data.chart.result[0].meta;
    const spot = meta.regularMarketPrice;
    const gap = symbol === 'BANKNIFTY' ? 100 : 50;
    const atmStrike = Math.round(spot / gap) * gap;
    
    // Generate synthetic option chain (approximations)
    const chain = [];
    const range = 15; // ±15 strikes around ATM
    
    for (let i = -range; i <= range; i++) {
      const strike = atmStrike + (i * gap);
      const moneyness = (strike - spot) / spot;
      
      // Approximate IV based on strike distance (higher for OTM)
      const baseIV = symbol === 'BANKNIFTY' ? 18 : 14;
      const iv = baseIV + Math.abs(moneyness) * 100;
      
      // Intrinsic value
      const callIntrinsic = Math.max(0, spot - strike);
      const putIntrinsic = Math.max(0, strike - spot);
      
      // Time value (approximation)
      const daysToExpiry = 7;
      const timeValue = (iv / 100) * spot * Math.sqrt(daysToExpiry / 365) * 0.4;
      
      // Approximate LTPs
      const ceLtp = callIntrinsic + timeValue * Math.exp(-Math.abs(i) * 0.15);
      const peLtp = putIntrinsic + timeValue * Math.exp(-Math.abs(i) * 0.15);
      
      // Approximate OI
      const baseOI = 50000;
      const oiMultiplier = Math.exp(-Math.abs(i) * 0.3) * (i <= 0 ? 1.2 : 1);
      
      chain.push({
        strike: strike,
        type: 'CE',
        ltp: Math.max(0.05, ceLtp),
        bid: Math.max(0.05, ceLtp * 0.98),
        ask: ceLtp * 1.02,
        volume: Math.floor(baseOI * Math.exp(-Math.abs(i) * 0.4) * 0.5),
        oi: Math.floor(baseOI * oiMultiplier),
        changeInOI: Math.floor((Math.random() - 0.5) * 10000),
        iv: iv
      });
      
      chain.push({
        strike: strike,
        type: 'PE',
        ltp: Math.max(0.05, peLtp),
        bid: Math.max(0.05, peLtp * 0.98),
        ask: peLtp * 1.02,
        volume: Math.floor(baseOI * Math.exp(-Math.abs(i) * 0.4) * 0.5),
        oi: Math.floor(baseOI * oiMultiplier),
        changeInOI: Math.floor((Math.random() - 0.5) * 10000),
        iv: iv
      });
    }
    
    res.json({
      symbol: symbol,
      spot: spot,
      atmStrike: atmStrike,
      timestamp: new Date().toISOString(),
      expiryDates: [new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]],
      currentExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
