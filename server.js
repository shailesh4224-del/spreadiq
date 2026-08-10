console.log('1. STARTING');
const express = require('express');

const axios = require('axios');
const app = express();
app.use(express.static('public'));
class NSESession {
 constructor() {
this.cookies = null;
this.lastFetch = 0;
this.minInterval = 1000;
}
  async getSession() {
    try {
            const homeResponse = await axios.get('https://www.nseindia.com', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000
      });
            const setCookies = homeResponse.headers['set-cookie'] || [];
      this.cookies = setCookies.map(c => c.split(';')[0]).join('; ');
      await axios.get('https://www.nseindia.com/option-chain', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': this.cookies
        },
        timeout: 10000
      });
      console.log('NSE session ready');
      return this.cookies;
    } catch (err) {
      console.error('NSE session error:', err.message);
      throw err;
    }
  }  async request(url, retries = 3) {
    const now = Date.now();
    const elapsed = now - this.lastFetch;
    if (elapsed < this.minInterval) {
      await new Promise(r => setTimeout(r, this.minInterval - elapsed));
    }
    this.lastFetch = Date.now();
    for (let attempt = 1; attempt <= retries; attempt++) {
            if (attempt > 1) {
        console.log('Waiting 3 seconds before retry...');
        await new Promise(r => setTimeout(r, 3000));
      }
      try {
        if (!this.cookies) await this.getSession();
               const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.nseindia.com/option-chain',
            'Origin': 'https://www.nseindia.com',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Cookie': this.cookies
          },
          timeout: 15000
        });
        return response.data;
      } catch (err) {
        console.log('Attempt ' + attempt + ' failed: ' + err.message);
        if (attempt === retries) throw err;
        this.cookies = null;
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
  }
}
const nse = new NSESession();
const cache = { optionChain: {}, cacheExpiry: 60000 };
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
app.get('/api/option-chain/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const symbolMap = { 'NIFTY': 'NIFTY', 'BANKNIFTY': 'BANKNIFTY', 'FINNIFTY': 'FINNIFTY' };
    const nseSymbol = symbolMap[symbol];
    if (!nseSymbol) return res.status(400).json({ error: 'Unknown symbol' });
    const cacheKey = symbol + '_' + new Date().toISOString().split('T')[0];
    if (cache.optionChain[cacheKey] && Date.now() - cache.optionChain[cacheKey].time < cache.cacheExpiry) {
      console.log('Returning cached data');
      return res.json(cache.optionChain[cacheKey].data);
    }
        return res.status(503).json({ error: 'NSE blocked - try during market hours or use broker API' });
    const spot = data.records.underlyingValue;
    const atmStrike = data.records.strikePrices.reduce((prev, curr) =>
      Math.abs(curr - spot) < Math.abs(prev - spot) ? curr : prev
    );
    const processed = {
      symbol: symbol, spot: spot, atmStrike: atmStrike,
      timestamp: data.records.timestamp,
      expiryDates: data.records.expiryDates,
      currentExpiry: data.records.expiryDates[0],
      chain: []
    };
    data.records.data.forEach(item => {
      if (item.CE) {
        processed.chain.push({
          strike: item.strikePrice, type: 'CE', ltp: item.CE.lastPrice,
          bid: item.CE.bidPrice, ask: item.CE.askPrice,
          volume: item.CE.totalTradedVolume, oi: item.CE.openInterest,
          changeInOI: item.CE.changeinOpenInterest, iv: item.CE.impliedVolatility
        });
      }
      if (item.PE) {
        processed.chain.push({
          strike: item.strikePrice, type: 'PE', ltp: item.PE.lastPrice,
          bid: item.PE.bidPrice, ask: item.PE.askPrice,
          volume: item.PE.totalTradedVolume, oi: item.PE.openInterest,
          changeInOI: item.PE.changeinOpenInterest, iv: item.PE.impliedVolatility
        });
      }
    });
    cache.optionChain[cacheKey] = { data: processed, time: Date.now() };
    res.json(processed);
  } catch (err) {
    console.error('Option chain error:', err);
    res.status(500).json({ error: err.message });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('SpreadIQ running on http://localhost:' + PORT);
  console.log('Using free NSE public APIs');
  console.log('Market hours: 9:00 AM - 3:30 PM IST');
});
console.log('4. FILE LOADED COMPLETELY');
process.on('uncaughtException', (err) => {
  console.log('ERROR CAUGHT:', err.message);
  console.log(err.stack);
});
