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
    res.json([]);
  }
});

app.get('/api/option-chain/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const yahooMap = {
      'NIFTY': '^NSEI',
      'BANKNIFTY': '^NSEBANK',
      'FINNIFTY': '^CNXIT'
    };
    
    const yahooSym = yahooMap[symbol];
    if (!yahooSym) return res.json({ error: 'Unknown symbol', spot: 24500, atmStrike: 24550, chain: [] });
    
    const meta = await fetchYahoo(yahooSym);
    if (!meta) return res.json({ error: 'Data unavailable', spot: 24500, atmStrike: 24550, chain: [] });
    
    const spot = meta.regularMarketPrice;
    const gap = symbol === 'BANKNIFTY' ? 100 : 50;
    const atmStrike = Math.round(spot / gap) * gap;
    
    const chain = [];
    for (let i = -15; i <= 15; i++) {
      const strike = atmStrike + (i * gap);
      const moneyness = (strike - spot) / spot;
      const baseIV = symbol === 'BANKNIFTY' ? 18 : 14;
      const iv = baseIV + Math.abs(moneyness) * 100;
      const callIntrinsic = Math.max(0, spot - strike);
      const putIntrinsic = Math.max(0, strike - spot);
      const timeValue = (iv / 100) * spot * Math.sqrt(7 / 365) * 0.4;
      
      chain.push({
        strike: strike, type: 'CE',
        ltp: Math.max(0.05, callIntrinsic + timeValue * Math.exp(-Math.abs(i) * 0.15)),
        bid: 0, ask: 0, volume: 0,
        oi: Math.floor(50000 * Math.exp(-Math.abs(i) * 0.3)),
        changeInOI: Math.floor((Math.random() - 0.5) * 10000),
        iv: iv
      });
      chain.push({
        strike: strike, type: 'PE',
        ltp: Math.max(0.05, putIntrinsic + timeValue * Math.exp(-Math.abs(i) * 0.15)),
        bid: 0, ask: 0, volume: 0,
        oi: Math.floor(50000 * Math.exp(-Math.abs(i) * 0.3)),
        changeInOI: Math.floor((Math.random() - 0.5) * 10000),
        iv: iv
      });
    }
    
    res.json({
      symbol: symbol,
      spot: spot,
      atmStrike: atmStrike,
      currentExpiry: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      chain: chain
    });
  } catch (err) {
    res.json({ error: err.message, spot: 24500, atmStrike: 24550, chain: [] });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('SpreadIQ running on port ' + PORT);
});
