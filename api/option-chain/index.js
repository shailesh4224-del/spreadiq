export default async function handler(req, res) {
  const url = req.url || '';
  const match = url.match(/\/api\/option-chain\/([A-Z0-9]+)/i);
  const symbol = (match ? match[1] : req.query.symbol || 'NIFTY').toUpperCase();
  
  const yahooMap = { NIFTY: 'NIFTY.NS', BANKNIFTY: 'BANKNIFTY.NS', FINNIFTY: 'FINNIFTY.NS' };
  const yahooSymbol = yahooMap[symbol] || (symbol + '.NS');
  const gapMap = { NIFTY: 50, BANKNIFTY: 100, FINNIFTY: 50 };
  const spotMap = { NIFTY: 24500, BANKNIFTY: 52500, FINNIFTY: 24250 };
  const gap = gapMap[symbol] || 50;

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/options/${yahooSymbol}`,
      { 
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000)
      }
    );
    const data = await response.json();
    const result = data.optionChain?.result?.[0];

    if (result && result.options?.[0]) {
      const spot = result.regularMarketPrice;
      const expiry = result.expirationDates[0] * 1000;
      const options = result.options[0];

      const chain = [];
      (options.calls || []).forEach(c => {
        chain.push({ strike: c.strike, type: 'CE', ltp: c.lastPrice || c.bid || 0, iv: c.impliedVolatility || 0, oi: c.openInterest || 0 });
      });
      (options.puts || []).forEach(p => {
        chain.push({ strike: p.strike, type: 'PE', ltp: p.lastPrice || p.bid || 0, iv: p.impliedVolatility || 0, oi: p.openInterest || 0 });
      });

      const atmStrike = Math.round(spot / gap) * gap;

      res.setHeader('Cache-Control', 's-maxage=5');
      return res.json({ spot, atmStrike, chain, expiry, source: 'yahoo' });
    }
  } catch (e) {}

  const spot = spotMap[symbol] || 24500;
  const atmStrike = Math.round(spot / gap) * gap;
  const chain = [];
  for (let i = -25; i <= 25; i++) {
    const strike = atmStrike + (i * gap);
    const ic = Math.max(0, spot - strike);
    const ip = Math.max(0, strike - spot);
    const tv = spot * 0.008 * Math.exp(-Math.abs(i) * 0.15);
    chain.push({ strike, type: 'CE', ltp: Math.max(0.5, ic + tv), iv: 14, oi: 0 });
    chain.push({ strike, type: 'PE', ltp: Math.max(0.5, ip + tv), iv: 14, oi: 0 });
  }
  return res.json({ 
    spot, 
    atmStrike, 
    chain, 
    expiry: Date.now() + 7 * 86400000, 
    source: 'synthetic' 
  });
}
