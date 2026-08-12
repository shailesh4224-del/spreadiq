const express = require('express');
const axios = require('axios');

const app = express();

// Root route - serve landing page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static('public'));

// ============= INDIAN INDICES (Yahoo Finance) =============
app.get('/api/indices', async (req, res) => {
  try {
    const symbols = [
      { name: 'NIFTY 50',   yahoo: '^NSEI' },
      { name: 'NIFTY BANK', yahoo: '^NSEBANK' },
      { name: 'SENSEX',     yahoo: '^BSESN' }
    ];
    const results = [];
    for (const sym of symbols) {
      try {
        const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + sym.yahoo + '?interval=1d&range=1d';
        const response = await axios.get(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          timeout: 10000
        });
        const meta = response.data.chart.result[0].meta;
        results.push({
          name: sym.name,
          last: meta.regularMarketPrice,
          change: meta.regularMarketPrice - meta.chartPreviousClose,
          percentChange: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100
        });
      } catch (err) {
        console.log('Index error:', sym.name);
      }
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= MCX COMMODITIES (Yahoo Finance via server) =============
app.get('/api/mcx', async (req, res) => {
  try {
    const symbols = [
      { name: 'GOLD',      yahoo: 'GC=F' },
      { name: 'SILVER',    yahoo: 'SI=F' },
      { name: 'CRUDE OIL', yahoo: 'CL=F' }
    ];
    const results = [];
    
    for (const sym of symbols) {
      try {
        const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + sym.yahoo + '?interval=1d&range=1d';
        const response = await axios.get(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          timeout: 10000
        });
        const meta = response.data.chart.result[0].meta;
        results.push({
          name: sym.name,
          last: meta.regularMarketPrice,
          change: meta.regularMarketPrice - meta.chartPreviousClose,
          percentChange: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100
        });
      } catch (err) {
        console.log('MCX error for ' + sym.name);
      }
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= MARKET DETAIL (ATM, Butterfly for any symbol) =============
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
    
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + yahooSym + '?interval=1d&range=1d';
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    const meta = response.data.chart.result[0].meta;
    const spot = meta.regularMarketPrice;
    
    // Determine strike gap based on symbol
    let gap = 50;
    if (symbol === 'NIFTY BANK') gap = 100;
    if (symbol === 'SENSEX') gap = 100;
    if (symbol === 'GOLD' || symbol === 'SILVER' || symbol === 'CRUDE OIL') gap = 10;
    
    const atmStrike = Math.round(spot / gap) * gap;
    
    // Generate synthetic option chain
    const chain = [];
    const range = 10;
    
    for (let i = -range; i <= range; i++) {
      const strike = atmStrike + (i * gap);
      const moneyness = (strike - spot) / spot;
      const baseIV = symbol.includes('BANK') ? 18 : symbol.includes('SENSEX') ? 14 : 15;
      const iv = baseIV + Math.abs(moneyness) * 100;
      const callIntrinsic = Math.max(0, spot - strike);
      const putIntrinsic = Math.max(0, strike - spot);
      const timeValue = (iv / 100) * spot * Math.sqrt(7 / 365) * 0.4;
      
      const ceLtp = Math.max(0.05, callIntrinsic + timeValue * Math.exp(-Math.abs(i) * 0.15));
      const peLtp = Math.max(0.05, putIntrinsic + timeValue * Math.exp(-Math.abs(i) * 0.15));
      
      chain.push({
        strike: strike, type: 'CE',
        ltp: ceLtp, bid: ceLtp * 0.98, ask: ceLtp * 1.02,
        volume: Math.floor(50000 * Math.exp(-Math.abs(i) * 0.4) * 0.5),
        oi: Math.floor(50000 * Math.exp(-Math.abs(i) * 0.3)),
        changeInOI: Math.floor((Math.random() - 0.5) * 10000),
        iv: iv
      });
      chain.push({
        strike: strike, type: 'PE',
        ltp: peLtp, bid: peLtp * 0.98, ask: peLtp * 1.02,
        volume: Math.floor(50000 * Math.exp(-Math.abs(i) * 0.4) * 0.5),
        oi: Math.floor(50000 * Math.exp(-Math.abs(i) * 0.3)),
        changeInOI: Math.floor((Math.random() - 0.5) * 10000),
        iv: iv
      });
    }
    
    res.json({
      symbol: symbol,
      spot: spot,
      atmStrike: atmStrike,
      timestamp: new Date().toISOString(),
      currentExpiry: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      chain: chain
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
