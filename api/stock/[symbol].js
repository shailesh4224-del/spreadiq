export default async function handler(req, res) {
  // Get symbol from query string (more reliable than file path)
  let symbol = req.query.symbol;
  
  if (!symbol) {
    // Try extracting from URL path
    const url = req.url || '';
    const match = url.match(/\/api\/stock\/([^\/\?]+)/);
    if (match) symbol = match[1];
  }
  
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol required' });
  }
  
  symbol = symbol.toUpperCase();
  const yahooSymbol = symbol + '.NS';
  
  const BASE = {
    'RELIANCE': 2450, 'TCS': 3850, 'INFY': 1480, 'HDFCBANK': 1620,
    'SBIN': 625, 'ITC': 445, 'TATAMOTORS': 920, 'MARUTI': 11200
  };
  
  try {
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/' + yahooSymbol + '?interval=1d&range=1d',
      { 
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(5000)
      }
    );
    const data = await response.json();
    const meta = data.chart?.result?.[0]?.meta;
    
    if (meta && meta.regularMarketPrice) {
      const last = meta.regularMarketPrice;
      const prev = meta.chartPreviousClose || last;
      return res.json({
        symbol: symbol,
        last: last,
        change: last - prev,
        percentChange: prev ? ((last - prev) / prev) * 100 : 0,
        source: 'yahoo'
      });
    }
  } catch (e) {
    // Fall through to fallback
  }
  
  // Fallback to synthetic data
  const base = BASE[symbol] || 1000;
  const change = base * (Math.random() - 0.5) * 0.03;
  return res.json({ 
    symbol, 
    last: base + change, 
    change, 
    percentChange: (change / base) * 100,
    source: 'fallback'
  });
}
