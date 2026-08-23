const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

app.get('/strategy.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/strategy.html'));
});

app.get('/strategy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

async function fetchYahoo(symbol) {
  try {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + symbol + '?interval=1d&range=1d';
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000
    });
    return response.data.chart.result[0].meta;
  } catch (err) {
    return null;
  }
}

app.get('/api/indices', async (req, res) => {
  const symbols = [
    { name: 'NIFTY 50',   yahoo: '^NSEI' },
    { name: 'NIFTY BANK', yahoo: '^NSEBANK' },
    { name: 'SENSEX',     yahoo: '^BSESN' },
    { name: 'GOLD',       yahoo: 'GC=F' },
    { name: 'SILVER',     yahoo: 'SI=F' },
    { name: 'CRUDE OIL',  yahoo: 'CL=F' }
  ];

  try {
    const results = await Promise.all(symbols.map(async (s) => {
      const data = await fetchYahoo(s.yahoo);
      if (!data) return null;
      const last = data.regularMarketPrice || data.previousClose || 0;
      const prev = data.chartPreviousClose || data.previousClose || last;
      const change = last - prev;
      const pct = prev ? (change / prev) * 100 : 0;
      return { name: s.name, last, change, percentChange: pct };
    }));
    res.json(results.filter(r => r !== null));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/option-chain/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  
  const SYMBOL_CONFIG = {
    'NIFTY':     { gap: 50,  nseName: 'NIFTY',     spot: 24500 },
    'BANKNIFTY': { gap: 100, nseName: 'BANKNIFTY', spot: 57500 },
    'FINNIFTY':  { gap: 50,  nseName: 'FINNIFTY',  spot: 24250 }
  };
  
  const config = SYMBOL_CONFIG[symbol];
  if (!config) return res.status(404).json({ error: 'Unknown symbol' });

  try {
    const yahooSymbol = config.nseName + '.NS';
    const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/options/${yahooSymbol}`;
    const yahooRes = await axios.get(yahooUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 8000
    });
    
    const result = yahooRes.data.optionChain?.result?.[0];
    if (!result) throw new Error('No Yahoo data');
    
    const spot = result.regularMarketPrice;
    const strikes = [...new Set([
      ...(result.options[0].calls || []).map(c => c.strike),
      ...(result.options[0].puts || []).map(p => p.strike)
    ])].sort((a, b) => a - b);
    
    const atmStrike = strikes.reduce((closest, s) =>
      Math.abs(s - spot) < Math.abs(closest - spot) ? s : closest
    );
    
    const chain = [];
    (result.options[0].calls || []).forEach(c =>
      chain.push({ strike: c.strike, type: 'CE', ltp: c.lastPrice || c.bid || 0, iv: c.impliedVolatility || 0, oi: c.openInterest || 0 })
    );
    (result.options[0].puts || []).forEach(p =>
      chain.push({ strike: p.strike, type: 'PE', ltp: p.lastPrice || p.bid || 0, iv: p.impliedVolatility || 0, oi: p.openInterest || 0 })
    );
    
    const expiry = result.expirationDates[0] * 1000;
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    res.json({ spot, atmStrike, chain, expiry });
    
  } catch (err) {
    console.log(`Yahoo failed for ${symbol}, using synthetic data`);
    
    const spot = config.spot;
    const atmStrike = Math.round(spot / config.gap) * config.gap;
    const chain = [];
    
    for (let i = -25; i <= 25; i++) {
      const strike = atmStrike + (i * config.gap);
      const distance = Math.abs(i) * config.gap;
      const intrinsicC = Math.max(0, spot - strike);
      const intrinsicP = Math.max(0, strike - spot);
      const tv = spot * 0.008 * Math.exp(-distance / (spot * 0.05));
      chain.push({ 
        strike, type: 'CE', 
        ltp: Math.max(0.5, intrinsicC + tv),
        iv: 14,
        oi: Math.floor(Math.random() * 1000000)
      });
      chain.push({ 
        strike, type: 'PE', 
        ltp: Math.max(0.5, intrinsicP + tv),
        iv: 14,
        oi: Math.floor(Math.random() * 1000000)
      });
    }
    
    res.json({ 
      spot, 
      atmStrike, 
      chain, 
      expiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
      source: 'synthetic'
    });
  }
});

app.get('/api/mcx', async (req, res) => {
  try {
    const symbols = [
      { name: 'GOLD',      yahoo: 'GC=F' },
      { name: 'SILVER',    yahoo: 'SI=F' },
      { name: 'CRUDE OIL', yahoo: 'CL=F' }
    ];
    
    const results = await Promise.all(symbols.map(async (s) => {
      const data = await fetchYahoo(s.yahoo);
      if (!data) return null;
      const last = data.regularMarketPrice || 0;
      const prev = data.previousClose || last;
      return {
        name: s.name,
        last,
        change: last - prev,
        percentChange: prev ? ((last - prev) / prev) * 100 : 0
      };
    }));
    res.json(results.filter(r => r !== null));
  } catch (err) {
    res.json([]);
  }
});

app.get('/api/market-detail/:symbol', async (req, res) => {
  const symbol = decodeURIComponent(req.params.symbol);
  
  const SYMBOL_MAP = {
    'NIFTY 50':   { yahoo: '^NSEI',    spot: 24500, gap: 50 },
    'NIFTY BANK': { yahoo: '^NSEBANK', spot: 57500, gap: 100 },
    'SENSEX':     { yahoo: '^BSESN',   spot: 78500, gap: 100 }
  };
  
  const config = SYMBOL_MAP[symbol] || { yahoo: '^NSEI', spot: 24500, gap: 50 };
  
  try {
    const meta = await fetchYahoo(config.yahoo);
    const spot = meta?.regularMarketPrice || config.spot;
    const atmStrike = Math.round(spot / config.gap) * config.gap;
    
    const chain = [];
    for (let i = -10; i <= 10; i++) {
      const strike = atmStrike + (i * config.gap);
      const intrinsicC = Math.max(0, spot - strike);
      const intrinsicP = Math.max(0, strike - spot);
      const tv = spot * 0.008 * Math.exp(-Math.abs(i) * 0.15);
      chain.push({ strike, type: 'CE', ltp: Math.max(0.5, intrinsicC + tv), iv: 15, oi: Math.random() * 1000000 });
      chain.push({ strike, type: 'PE', ltp: Math.max(0.5, intrinsicP + tv), iv: 15, oi: Math.random() * 1000000 });
    }
    
    res.json({ spot, atmStrike, chain });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SpreadIQ on port ${PORT}`));
