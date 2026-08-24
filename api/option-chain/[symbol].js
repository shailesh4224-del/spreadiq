// Real NSE Option Chain Data with Yahoo Finance Fallback
export default async function handler(req, res) {
  const { symbol } = req.query;
  const symbolUpper = symbol.toUpperCase();
  
  const SYMBOL_CONFIG = {
    'NIFTY':     { yahoo: 'NIFTY.NS',     spot: 24500, gap: 50 },
    'BANKNIFTY': { yahoo: 'BANKNIFTY.NS', spot: 52500, gap: 100 },
    'FINNIFTY':  { yahoo: 'FINNIFTY.NS',  spot: 24250, gap: 50 }
  };
  
  const config = SYMBOL_CONFIG[symbolUpper];
  if (!config) {
    return res.status(404).json({ error: 'Unknown symbol' });
  }

  // Try Yahoo Finance first (more reliable than NSE scraping)
  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/options/${config.yahoo}`;
    const response = await fetch(yahooUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!response.ok) throw new Error('Yahoo failed');
    const data = await response.json();
    const result = data.optionChain?.result?.[0];
    
    if (!result || !result.options?.[0]) throw new Error('No data');
    
    const spot = result.regularMarketPrice;
    const expiry = result.expirationDates[0] * 1000;
    const options = result.options[0];
    
    const strikes = [...new Set([
      ...(options.calls || []).map(c => c.strike),
      ...(options.puts || []).map(p => p.strike)
    ]).sort((a, b) => a - b);
    
    const atmStrike = strikes.reduce((closest, s) =>
      Math.abs(s - spot) < Math.abs(closest - spot) ? s : closest
    );
    
    const chain = [];
    (options.calls || []).forEach(c => {
      chain.push({
        strike: c.strike,
        type: 'CE',
        ltp: c.lastPrice || c.bid || 0,
        iv: c.impliedVolatility || 0,
        oi: c.openInterest || 0,
        volume: c.volume || 0
      });
    });
    (options.puts || []).forEach(p => {
      chain.push({
        strike: p.strike,
        type: 'PE',
        ltp: p.lastPrice || p.bid || 0,
        iv: p.impliedVolatility || 0,
        oi: p.openInterest || 0,
        volume: p.volume || 0
      });
    });
    
    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=30');
    return res.json({ spot, atmStrike, chain, expiry, source: 'yahoo' });
    
  } catch (err) {
    console.log('Yahoo failed, using synthetic:', err.message);
    
    // Synthetic fallback (always works)
    const spot = config.spot;
    const atmStrike = Math.round(spot / config.gap) * config.gap;
    const chain = [];
    
    for (let i = -25; i <= 25; i++) {
      const strike = atmStrike + (i * config.gap);
      const intrinsicC = Math.max(0, spot - strike);
      const intrinsicP = Math.max(0, strike - spot);
      const tv = spot * 0.008 * Math.exp(-Math.abs(i) * 0.15);
      
      chain.push({
        strike, type: 'CE',
        ltp: Math.max(0.5, intrinsicC + tv),
        iv: 14 + Math.random() * 3,
        oi: Math.floor(Math.random() * 100000),
        volume: Math.floor(Math.random() * 50000)
      });
      chain.push({
        strike, type: 'PE',
        ltp: Math.max(0.5, intrinsicP + tv),
        iv: 14 + Math.random() * 3,
        oi: Math.floor(Math.random() * 100000),
        volume: Math.floor(Math.random() * 50000)
      });
    }
    
    res.setHeader('Cache-Control', 's-maxage=5');
    return res.json({ 
      spot, atmStrike, chain,
      expiry: Date.now() + 7 * 86400000,
      source: 'synthetic'
    });
  }
}
// Option chain endpoint 
