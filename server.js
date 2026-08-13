const express = require('express');
const axios = require('axios');

const app = express();

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static('public'));

async function fetchYahoo(symbol) {
  try {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + symbol + '?interval=1d&range=1d';
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000
    });
    return response.data.chart.result[0].meta;
  } catch (err) {
    console.log('Yahoo error:', symbol);
    return null;
  }
}

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

app.get('/api/mcx', async (req, res) => {
  try {
    const symbols = [
      { name: 'GOLD',      yahoo: 'GC=F' },
      { name: 'SILVER',    yahoo: 'SI=F' },
      { name: 'CRUDE OIL', yahoo: 'CL=F' }
    ];
    const results = [];
    const usdToInr = 83;
    for (const sym of symbols) {
      const meta = await fetchYahoo(sym.yahoo);
      if (meta) {
        results.push({
          name: sym.name,
          last: meta.regularMarketPrice * usdToInr,
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
    if (!meta) return res.status(500).json({ error: 'Failed to fetch' });
    
    const isMCX = symbol.includes('GOLD') || symbol.includes('SILVER') || symbol.includes('CRUDE');
    const usdToInr = isMCX ? 83 : 1;
    const spot = meta.regularMarketPrice * usdToInr;
    
    let gap = 50;
    if (symbol === 'NIFTY BANK' || symbol === 'SENSEX') gap = 100;
    if (isMCX) gap = Math.round(spot / 10) * 10;
    
    const atmStrike = Math.round(spot / gap) * gap;
    
    const chain = [];
    const range = 10;
    
    for (let i = -range; i <= range; i++) {
      const strike = atmStrike + (i * gap);
      const moneyness = (strike - spot) / spot;
      const baseIV = symbol.includes('BANK') ? 18 : 15;
      const iv = baseIV + Math.abs(moneyness) * 100;
      const callIntrinsic = Math.max(0, spot - strike);
      const putIntrinsic = Math.max(0, strike - spot);
      const timeValue = (iv / 100) * spot * Math.sqrt(7 / 365) * 0.4;
      
      chain.push({ strike: strike, type: 'CE', ltp: Math.max(0.05, callIntrinsic + timeValue * Math.exp(-Math.abs(i) * 0.15)), iv: iv, oi: Math.floor(50000 * Math.exp(-Math.abs(i) * 0.3)) });
      chain.push({ strike: strike, type: 'PE', ltp: Math.max(0.05, putIntrinsic + timeValue * Math.exp(-Math.abs(i) * 0.15)), iv: iv, oi: Math.floor(50000 * Math.exp(-Math.abs(i) * 0.3)) });
    }
    
    res.json({ symbol: symbol, spot: spot, atmStrike: atmStrike, currentExpiry: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], chain: chain });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('SpreadIQ running on port ' + PORT);
});
