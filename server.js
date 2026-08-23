const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

// ===== ROUTES =====
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'public/dashboard.html')));
app.get('/strategy.html', (req, res) => res.sendFile(path.join(__dirname, 'public/strategy.html')));
app.get('/strategy', (req, res) => res.sendFile(path.join(__dirname, 'public/dashboard.html')));

// ===== SYNTHETIC DATA GENERATORS =====

// Realistic Indian stock prices (approximate)
const STOCK_DATA = {
  'RELIANCE': { base: 2450, vol: 0.02 },
  'TCS': { base: 3850, vol: 0.015 },
  'INFY': { base: 1480, vol: 0.018 },
  'HDFCBANK': { base: 1620, vol: 0.012 },
  'ICICIBANK': { base: 1050, vol: 0.014 },
  'SBIN': { base: 625, vol: 0.018 },
  'BHARTIARTL': { base: 1180, vol: 0.016 },
  'ITC': { base: 445, vol: 0.010 },
  'KOTAKBANK': { base: 1750, vol: 0.013 },
  'LT': { base: 3450, vol: 0.015 },
  'HINDUNILVR': { base: 2380, vol: 0.011 },
  'ASIANPAINT': { base: 2890, vol: 0.014 },
  'MARUTI': { base: 11200, vol: 0.016 },
  'AXISBANK': { base: 1080, vol: 0.015 },
  'SUNPHARMA': { base: 1620, vol: 0.014 },
  'TITAN': { base: 3280, vol: 0.017 },
  'BAJAJFINSV': { base: 1620, vol: 0.018 },
  'NESTLEIND': { base: 2240, vol: 0.010 },
  'ULTRACEMCO': { base: 9800, vol: 0.014 },
  'WIPRO': { base: 445, vol: 0.016 },
  'HCLTECH': { base: 1480, vol: 0.015 },
  'POWERGRID': { base: 285, vol: 0.012 },
  'NTPC': { base: 320, vol: 0.013 },
  'M&M': { base: 1620, vol: 0.016 },
  'TECHM': { base: 1180, vol: 0.017 },
  'TATASTEEL': { base: 145, vol: 0.020 },
  'INDIGO': { base: 3850, vol: 0.018 },
  'JSWSTEEL': { base: 820, vol: 0.019 },
  'CIPLA': { base: 1180, vol: 0.014 },
  'COALINDIA': { base: 425, vol: 0.015 },
  'ONGC': { base: 245, vol: 0.016 },
  'BPCL': { base: 580, vol: 0.014 },
  'ADANIENT': { base: 2820, vol: 0.025 },
  'ADANIPORTS': { base: 1380, vol: 0.020 },
  'TATAMOTORS': { base: 920, vol: 0.018 },
  'BAJAJ-AUTO': { base: 9200, vol: 0.015 },
  'EICHERMOT': { base: 3680, vol: 0.014 },
  'HEROMOTOCO': { base: 4480, vol: 0.014 },
  'DRREDDY': { base: 6280, vol: 0.013 },
  'DIVISLAB': { base: 3680, vol: 0.015 },
  'BRITANNIA': { base: 4820, vol: 0.011 },
  'VEDL': { base: 445, vol: 0.020 },
  'HINDALCO': { base: 580, vol: 0.018 },
  'NMDC': { base: 65, vol: 0.022 },
  'SAIL': { base: 118, vol: 0.020 },
  'JINDALSTEL': { base: 820, vol: 0.019 },
  'INDUSINDBK': { base: 1480, vol: 0.017 },
  'FEDERALBNK': { base: 165, vol: 0.018 },
  'IDFCFIRSTB': { base: 78, vol: 0.020 },
  'PNB': { base: 118, vol: 0.018 },
  'BANKBARODA': { base: 248, vol: 0.016 },
  'CANBK': { base: 108, vol: 0.017 },
  'BANDHANBNK': { base: 248, vol: 0.020 },
  'RBLBANK': { base: 268, vol: 0.022 },
  'HDFCAMC': { base: 3280, vol: 0.014 },
  'NAUKRI': { base: 5480, vol: 0.018 },
  'PIDILITIND': { base: 2820, vol: 0.014 },
  'GODREJCP': { base: 1280, vol: 0.013 },
  'DABUR': { base: 580, vol: 0.012 },
  'COLPAL': { base: 1620, vol: 0.012 },
  'BERGEPAINT': { base: 580, vol: 0.013 },
  'SIEMENS': { base: 5280, vol: 0.014 },
  'HAVELLS': { base: 1620, vol: 0.015 },
  'POLYCAB': { base: 4480, vol: 0.016 },
  'VOLTAS': { base: 980, vol: 0.015 },
  'CUMMINSIND': { base: 2820, vol: 0.014 },
  'THERMAX': { base: 3280, vol: 0.015 },
  'AIAENG': { base: 3850, vol: 0.013 },
  'SCHAEFFLER': { base: 2820, vol: 0.015 },
  'TIMKEN': { base: 2820, vol: 0.016 },
  'SKFINDIA': { base: 1820, vol: 0.014 },
  'GRINDWELL': { base: 1820, vol: 0.013 },
  'CARBORUNIV': { base: 1180, vol: 0.015 },
  'APOLLOTYRE': { base: 445, vol: 0.016 },
  'MRF': { base: 128000, vol: 0.013 },
  'BALKRISIND': { base: 2480, vol: 0.014 },
  'CEAT': { base: 2480, vol: 0.016 },
  'EXIDEIND': { base: 380, vol: 0.017 },
  'BHARATFORG': { base: 1180, vol: 0.016 },
  'MOTHERSON': { base: 78, vol: 0.018 },
  'BHEL': { base: 118, vol: 0.020 },
  'BEL': { base: 285, vol: 0.016 },
  'HAL': { base: 3850, vol: 0.015 },
  'BDL': { base: 1180, vol: 0.018 },
  'MAZDOCK': { base: 2820, vol: 0.020 },
  'COCHINSHIP': { base: 1820, vol: 0.018 },
  'GRSE': { base: 1820, vol: 0.020 },
  'TATAPOWER': { base: 380, vol: 0.018 },
  'ADANIGREEN': { base: 1820, vol: 0.022 },
  'ADANITRANS': { base: 880, vol: 0.020 },
  'JSWENERGY': { base: 580, vol: 0.018 },
  'SUZLON': { base: 45, vol: 0.025 },
  'SOLARINDS': { base: 880, vol: 0.020 },
  'PREMIERENE': { base: 880, vol: 0.020 },
  'IOC': { base: 145, vol: 0.015 },
  'HINDPETRO': { base: 380, vol: 0.017 },
  'GAIL': { base: 185, vol: 0.016 },
  'OIL': { base: 480, vol: 0.018 },
  'PETRONET': { base: 285, vol: 0.014 },
  'CASTROLIND': { base: 220, vol: 0.015 },
  'GULFOILLUB': { base: 580, vol: 0.014 },
  'CHAMBLFERT': { base: 480, vol: 0.016 },
  'COROMANDEL': { base: 1280, vol: 0.014 },
  'UPL': { base: 580, vol: 0.018 },
  'PIIND': { base: 3480, vol: 0.015 },
  'SUMICHEM': { base: 480, vol: 0.016 },
  'BAYERCROP': { base: 4820, vol: 0.014 },
  'INSECTICID': { base: 680, vol: 0.018 },
  'RALLIS': { base: 285, vol: 0.018 },
  'DHANUKA': { base: 880, vol: 0.016 },
  'BALRAMCHIN': { base: 380, vol: 0.018 },
  'TRENT': { base: 4820, vol: 0.018 },
  'ABFRL': { base: 285, vol: 0.018 },
  'BATAINDIA': { base: 1480, vol: 0.014 },
  'PAGEIND': { base: 38200, vol: 0.013 },
  'RELAXO': { base: 580, vol: 0.016 },
  'KANSAINER': { base: 580, vol: 0.015 },
  'METROPOLIS': { base: 1820, vol: 0.016 },
  'THYROCARE': { base: 880, vol: 0.020 },
  'DRLAL': { base: 1280, vol: 0.014 },
  'FORTIS': { base: 445, vol: 0.016 },
  'APOLLOHOSP': { base: 6480, vol: 0.014 },
  'MAXHEALTH': { base: 880, vol: 0.018 },
  'BIOCON': { base: 285, vol: 0.020 },
  'LUPIN': { base: 1180, vol: 0.016 },
  'AUROPHARMA': { base: 880, vol: 0.018 },
  'GLENMARK': { base: 880, vol: 0.020 },
  'TORNTPHARM': { base: 1820, vol: 0.016 },
  'LAURUSLABS': { base: 580, vol: 0.020 },
  'CADILAHC': { base: 580, vol: 0.018 },
  'AJANTPHARM': { base: 1820, vol: 0.016 },
  'GRANULES': { base: 380, vol: 0.018 },
  'NATCOPHARM': { base: 880, vol: 0.018 },
  'IPCALAB': { base: 2280, vol: 0.016 },
  'PFIZER': { base: 4820, vol: 0.013 },
  'SANOFI': { base: 6820, vol: 0.012 },
  'ABBOTINDIA': { base: 24800, vol: 0.013 },
  'GLAXO': { base: 1820, vol: 0.013 },
  'DIVI': { base: 4480, vol: 0.014 },
  'MANKIND': { base: 2280, vol: 0.016 },
  'JBCHEPHARM': { base: 1820, vol: 0.016 },
  'SUVEN': { base: 580, vol: 0.020 },
  'HDFCLIFE': { base: 680, vol: 0.016 },
  'SBILIFE': { base: 1480, vol: 0.014 },
  'ICICIPRULI': { base: 580, vol: 0.014 },
  'BAJAJHLDNG': { base: 7820, vol: 0.014 },
  'PRSMJHIND': { base: 128, vol: 0.022 },
  'ROLEXRINGS': { base: 2280, vol: 0.016 },
  'ENDURANCE': { base: 1620, vol: 0.016 },
  'FIEMIND': { base: 1280, vol: 0.020 },
  'GABRIEL': { base: 380, vol: 0.020 },
  'SPARC': { base: 580, vol: 0.024 },
  'JAMNAAUTO': { base: 128, vol: 0.020 },
  'RML': { base: 1280, vol: 0.018 },
  'RANEHOLDIN': { base: 580, vol: 0.020 },
  'BANCOINDIA': { base: 285, vol: 0.020 },
  'LUMAXTECH': { base: 580, vol: 0.020 },
  'SUNDARAM': { base: 285, vol: 0.020 },
  'AMARAJABAT': { base: 580, vol: 0.018 },
  'BOSCHLTD': { base: 18200, vol: 0.013 },
  'WABCOINDIA': { base: 6480, vol: 0.016 },
  'OBEROIRLTY': { base: 1820, vol: 0.018 },
  'DLF': { base: 820, vol: 0.018 },
  'GODREJPROP': { base: 2820, vol: 0.018 },
  'PRESTIGE': { base: 1820, vol: 0.020 },
  'BRIGADE': { base: 1280, vol: 0.020 },
  'SOBHA': { base: 1820, vol: 0.018 },
  'PHOENIXLTD': { base: 1820, vol: 0.016 },
  'MAHLIFE': { base: 580, vol: 0.018 },
  'LODHA': { base: 1480, vol: 0.018 }
};

// Use a daily "seed" so data is consistent for the day but changes next day
const today = new Date().toDateString();
let seedValue = 0;
for (let i = 0; i < today.length; i++) seedValue += today.charCodeAt(i);

function seededRandom(symbol) {
  let hash = 0;
  const str = symbol + today;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

function getSyntheticStock(symbol) {
  const data = STOCK_DATA[symbol] || { base: 100, vol: 0.02 };
  const random = seededRandom(symbol);
  // Price moves based on daily seed + per-stock variation
  const dailyChange = (random - 0.5) * 2 * data.vol; // -vol to +vol
  const change = data.base * dailyChange;
  const last = data.base + change;
  const pct = (change / data.base) * 100;
  const volume = Math.floor(50000 + random * 5000000);
  return { symbol, last, change, percentChange: pct, volume };
}

// ===== API ENDPOINTS =====

// Single stock data
app.get('/api/stock/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  res.json(getSyntheticStock(symbol));
});

// Indices (NIFTY, BANKNIFTY, SENSEX, MCX)
app.get('/api/indices', (req, res) => {
  const indices = [
    { name: 'NIFTY 50',   base: 24500, vol: 0.008 },
    { name: 'NIFTY BANK', base: 52500, vol: 0.012 },
    { name: 'SENSEX',     base: 80500, vol: 0.008 },
    { name: 'GOLD',       base: 73800, vol: 0.006 },
    { name: 'SILVER',     base: 91200, vol: 0.012 },
    { name: 'CRUDE OIL',  base: 82, vol: 0.015 }
  ];
  res.json(indices.map(idx => {
    const random = seededRandom(idx.name);
    const change = idx.base * (random - 0.5) * 2 * idx.vol;
    return {
      name: idx.name,
      last: idx.base + change,
      change: change,
      percentChange: (change / idx.base) * 100
    };
  }));
});

// MCX endpoint
app.get('/api/mcx', (req, res) => {
  const mcx = [
    { name: 'GOLD',      base: 73800, vol: 0.006 },
    { name: 'SILVER',    base: 91200, vol: 0.012 },
    { name: 'CRUDE OIL', base: 82,    vol: 0.015 }
  ];
  res.json(mcx.map(m => {
    const random = seededRandom(m.name);
    const change = m.base * (random - 0.5) * 2 * m.vol;
    return {
      name: m.name,
      last: m.base + change,
      change: change,
      percentChange: (change / m.base) * 100
    };
  }));
});

// Market detail (option chain for index)
app.get('/api/market-detail/:symbol', (req, res) => {
  const symbol = decodeURIComponent(req.params.symbol);
  const SYMBOL_MAP = {
    'NIFTY 50':   { spot: 24500, gap: 50 },
    'NIFTY BANK': { spot: 52500, gap: 100 },
    'SENSEX':     { spot: 80500, gap: 100 }
  };
  const config = SYMBOL_MAP[symbol] || { spot: 24500, gap: 50 };
  const spot = config.spot;
  const atmStrike = Math.round(spot / config.gap) * config.gap;
  const chain = [];
  for (let i = -10; i <= 10; i++) {
    const strike = atmStrike + (i * config.gap);
    const intrinsicC = Math.max(0, spot - strike);
    const intrinsicP = Math.max(0, strike - spot);
    const tv = spot * 0.008 * Math.exp(-Math.abs(i) * 0.15);
    chain.push({ strike, type: 'CE', ltp: Math.max(0.5, intrinsicC + tv), iv: 14, oi: Math.floor(seededRandom(strike + 'CE') * 1000000) });
    chain.push({ strike, type: 'PE', ltp: Math.max(0.5, intrinsicP + tv), iv: 14, oi: Math.floor(seededRandom(strike + 'PE') * 1000000) });
  }
  res.json({ spot, atmStrike, chain });
});

// Option chain endpoint (for strategy.html)
app.get('/api/option-chain/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const SYMBOL_CONFIG = {
    'NIFTY':     { gap: 50,  spot: 24500 },
    'BANKNIFTY': { gap: 100, spot: 52500 },
    'FINNIFTY':  { gap: 50,  spot: 24250 }
  };
  const config = SYMBOL_CONFIG[symbol];
  if (!config) return res.status(404).json({ error: 'Unknown symbol' });

  const spot = config.spot;
  const atmStrike = Math.round(spot / config.gap) * config.gap;
  const chain = [];
  for (let i = -25; i <= 25; i++) {
    const strike = atmStrike + (i * config.gap);
    const intrinsicC = Math.max(0, spot - strike);
    const intrinsicP = Math.max(0, strike - spot);
    const tv = spot * 0.008 * Math.exp(-Math.abs(i) * 0.15);
    chain.push({ strike, type: 'CE', ltp: Math.max(0.5, intrinsicC + tv), iv: 14, oi: Math.floor(seededRandom(strike + 'CE') * 1000000) });
    chain.push({ strike, type: 'PE', ltp: Math.max(0.5, intrinsicP + tv), iv: 14, oi: Math.floor(seededRandom(strike + 'PE') * 1000000) });
  }
  res.json({
    spot,
    atmStrike,
    chain,
    expiry: Date.now() + 7 * 86400000
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('SpreadIQ on port ' + PORT));
