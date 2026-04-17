const express = require('express');
const cors = require('cors');
const axios = require('axios');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// ──────────────────────────────────────
// Configuration
// ──────────────────────────────────────

const NEWS_API_KEY = process.env.NEWS_API_KEY || '';
const NEWS_API_URL = 'https://newsapi.org/v2/everything';
const YAHOO_SPARK_URLS = [
  'https://query1.finance.yahoo.com/v8/finance/spark',
  'https://query2.finance.yahoo.com/v8/finance/spark',
];

const INDIAN_STOCKS = {
  nifty50: '^NSEI',
  sensex: '^BSESN',
  niftyBank: '^NSEBANK',
  topStocks: [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
    'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS',
    'LT.NS', 'BAJFINANCE.NS', 'AXISBANK.NS', 'ASIANPAINT.NS', 'MARUTI.NS',
    'WIPRO.NS', 'HCLTECH.NS', 'ULTRACEMCO.NS', 'NESTLEIND.NS', 'TITAN.NS',
  ],
};

const sectorQueries = {
  all: 'Indian stock market OR NSE OR BSE OR Sensex OR Nifty',
  nifty50: 'Nifty 50 OR NSE OR India equities',
  banking: 'Indian banking stocks OR RBI OR private banks OR PSU banks',
  it: 'Indian IT stocks OR Infosys OR TCS OR Wipro OR HCLTech',
  energy: 'Indian energy stocks OR Reliance OR oil and gas India',
  fmcg: 'Indian FMCG stocks OR Hindustan Unilever OR ITC OR Nestle India',
  auto: 'Indian auto stocks OR Maruti OR Tata Motors OR auto sector India',
};

const stockNameMap = {
  RELIANCE: 'Reliance Industries',
  TCS: 'Tata Consultancy Services',
  HDFCBANK: 'HDFC Bank',
  INFY: 'Infosys',
  ICICIBANK: 'ICICI Bank',
  ITC: 'ITC',
  SBIN: 'State Bank of India',
  BHARTIARTL: 'Bharti Airtel',
  KOTAKBANK: 'Kotak Mahindra Bank',
  LT: 'Larsen & Toubro',
  BAJFINANCE: 'Bajaj Finance',
  AXISBANK: 'Axis Bank',
  ASIANPAINT: 'Asian Paints',
  MARUTI: 'Maruti Suzuki',
  WIPRO: 'Wipro',
  HCLTECH: 'HCLTech',
  ULTRACEMCO: 'UltraTech Cement',
  NESTLEIND: 'Nestle India',
  TITAN: 'Titan Company',
  HINDUNILVR: 'Hindustan Unilever',
};

// ──────────────────────────────────────
// In-Memory Cache
// ──────────────────────────────────────

class Cache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key, data, ttlMs) {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  clear() {
    this.store.clear();
  }

  get size() {
    return this.store.size;
  }
}

const cache = new Cache();

const CACHE_TTL = {
  quotes: 15 * 1000,       // 15 seconds
  indices: 15 * 1000,      // 15 seconds
  chart: 30 * 1000,        // 30 seconds
  search: 60 * 1000,       // 1 minute
  news: 5 * 60 * 1000,     // 5 minutes
  summary: 15 * 1000,      // 15 seconds
};

// ──────────────────────────────────────
// Helpers
// ──────────────────────────────────────

const sanitizeSymbol = (value = '') =>
  value.trim().toUpperCase().replace(/[^A-Z0-9.^]/g, '');

const symbolToEntity = (rawSymbol = '') => {
  const symbol = sanitizeSymbol(rawSymbol).replace(/\.(NS|BO)$/i, '');
  return stockNameMap[symbol] || rawSymbol;
};

const buildNewsQuery = (query = '', category = 'all') => {
  const normalizedCategory = String(category || 'all').toLowerCase();
  const trimmed = String(query || '').trim();

  if (trimmed) {
    if (/^[A-Z.^]+(\.(NS|BO))?$/i.test(trimmed)) {
      return `${symbolToEntity(trimmed)} OR ${trimmed}`;
    }
    return trimmed;
  }

  return sectorQueries[normalizedCategory] || sectorQueries.all;
};

const buildSymbolsList = (symbols) =>
  String(symbols || '')
    .split(',')
    .map((symbol) => sanitizeSymbol(symbol))
    .filter(Boolean);

const getIndianMarketStatus = () => {
  const nowInIndia = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  );
  const day = nowInIndia.getDay();
  const minutes = nowInIndia.getHours() * 60 + nowInIndia.getMinutes();
  const isWeekday = day >= 1 && day <= 5;
  const isOpen = isWeekday && minutes >= (9 * 60 + 15) && minutes <= (15 * 60 + 30);

  return {
    isOpen,
    timestamp: nowInIndia.toISOString(),
    timezone: 'Asia/Kolkata',
  };
};

const getLiveCacheTtl = () => (getIndianMarketStatus().isOpen ? 5 * 1000 : 15 * 1000);

// ──────────────────────────────────────
// Yahoo Finance via yahoo-finance2 library
// ──────────────────────────────────────

/**
 * Fetch quotes for multiple symbols using yahoo-finance2.
 * Uses quoteCombine under the hood for efficient batching.
 */
const fetchQuotes = async (symbols) => {
  if (!symbols || symbols.length === 0) return [];

  const results = await Promise.allSettled(
    symbols.map((symbol) => yahooFinance.quote(symbol))
  );

  return results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value);
};

const fetchSparkSnapshots = async (symbols) => {
  if (!symbols || symbols.length === 0) return {};

  for (const url of YAHOO_SPARK_URLS) {
    try {
      const response = await axios.get(url, {
        params: {
          symbols: symbols.join(','),
          range: '1d',
          interval: '1m',
          indicators: 'close',
          includePrePost: false,
          formatted: false,
          corsDomain: 'finance.yahoo.com',
          _: Date.now(),
        },
        timeout: 12000,
      });

      return Object.entries(response.data || {}).reduce((accumulator, [symbol, payload]) => {
        const sparkResponse = payload?.response?.[0];
        const closes = sparkResponse?.indicators?.quote?.[0]?.close || [];
        const latestClose = [...closes].reverse().find((value) => typeof value === 'number');
        const meta = sparkResponse?.meta || {};
        const previousClose = meta.previousClose;
        const marketPrice = meta.regularMarketPrice ?? latestClose;

        if (typeof marketPrice === 'number') {
          const marketChange =
            typeof previousClose === 'number' ? marketPrice - previousClose : undefined;
          const marketChangePercent =
            typeof previousClose === 'number' && previousClose !== 0
              ? (marketChange / previousClose) * 100
              : undefined;

          accumulator[symbol] = {
            regularMarketPrice: marketPrice,
            regularMarketChange: marketChange,
            regularMarketChangePercent: marketChangePercent,
            marketState: meta.marketState,
            sparkTimestamp: meta.regularMarketTime,
          };
        }

        return accumulator;
      }, {});
    } catch (error) {
      continue;
    }
  }

  return {};
};

const mergeLiveQuoteData = (quotes, sparkSnapshots) =>
  quotes.map((quote) => {
    const spark = sparkSnapshots[quote.symbol];
    if (!spark) {
      return quote;
    }

    return {
      ...quote,
      regularMarketPrice:
        typeof spark.regularMarketPrice === 'number' ? spark.regularMarketPrice : quote.regularMarketPrice,
      regularMarketChange:
        typeof spark.regularMarketChange === 'number' ? spark.regularMarketChange : quote.regularMarketChange,
      regularMarketChangePercent:
        typeof spark.regularMarketChangePercent === 'number'
          ? spark.regularMarketChangePercent
          : quote.regularMarketChangePercent,
      marketState: spark.marketState || quote.marketState,
      sparkTimestamp: spark.sparkTimestamp,
    };
  });

/**
 * Fetch chart data for a single symbol.
 */
const fetchChart = async (symbol, range = '1d', interval = '5m') => {
  const result = await yahooFinance.chart(symbol, {
    period1: getChartPeriod1(range),
    interval,
  });

  return result;
};

/**
 * Calculate period1 date from range string.
 */
const getChartPeriod1 = (range) => {
  const now = new Date();
  switch (range) {
    case '1d': { const d = new Date(now); d.setDate(d.getDate() - 2); return d; }
    case '5d': { const d = new Date(now); d.setDate(d.getDate() - 5); return d; }
    case '1mo': { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d; }
    case '3mo': { const d = new Date(now); d.setMonth(d.getMonth() - 3); return d; }
    case '6mo': { const d = new Date(now); d.setMonth(d.getMonth() - 6); return d; }
    case '1y': { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; }
    case '5y': { const d = new Date(now); d.setFullYear(d.getFullYear() - 5); return d; }
    default: { const d = new Date(now); d.setDate(d.getDate() - 2); return d; }
  }
};

/**
 * Search for stocks using yahoo-finance2.
 */
const searchStocks = async (query) => {
  const result = await yahooFinance.search(query, {
    quotesCount: 12,
    newsCount: 0,
  });

  // Filter to Indian exchanges
  const quotes = (result.quotes || []).filter(
    (item) =>
      item.exchange === 'NSI' ||
      item.exchange === 'BSE' ||
      item.exchange === 'NSE' ||
      /\.(NS|BO)$/i.test(item.symbol || '')
  );

  return { ...result, quotes };
};

// ──────────────────────────────────────
// News Fetchers
// ──────────────────────────────────────

const mapNewsApiArticle = (article, query) => ({
  title: article.title,
  summary: article.description || article.content || '',
  publisher: article.source?.name || 'News API',
  link: article.url,
  providerPublishTime: article.publishedAt
    ? Math.floor(new Date(article.publishedAt).getTime() / 1000)
    : Math.floor(Date.now() / 1000),
  relatedTickers: [],
  thumbnail: article.urlToImage || '',
  sourceType: 'newsapi',
  query,
});

const fetchNewsFromNewsApi = async (query, pageSize = 18) => {
  if (!NEWS_API_KEY) return [];

  const response = await axios.get(NEWS_API_URL, {
    params: {
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize,
      searchIn: 'title,description',
    },
    headers: { 'X-Api-Key': NEWS_API_KEY },
    timeout: 12000,
  });

  return (response.data?.articles || [])
    .filter((article) => article.title && article.url)
    .map((article) => mapNewsApiArticle(article, query));
};

const fetchNewsFromYahoo = async (query) => {
  try {
    const result = await yahooFinance.search(query, {
      quotesCount: 0,
      newsCount: 20,
    });

    return (result.news || []).map((item) => ({
      title: item.title,
      summary: item.summary || item.snippet || '',
      publisher: item.publisher || 'Yahoo Finance',
      link: item.link,
      providerPublishTime: item.providerPublishTime || Math.floor(Date.now() / 1000),
      relatedTickers: Array.isArray(item.relatedTickers) ? item.relatedTickers : [],
      thumbnail:
        item.thumbnail?.resolutions?.[0]?.url ||
        item.thumbnail?.originalUrl ||
        '',
      sourceType: 'yahoo',
    }));
  } catch (error) {
    console.error('Yahoo news fetch error:', error.message);
    return [];
  }
};

// ──────────────────────────────────────
// API Routes
// ──────────────────────────────────────

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    cacheSize: cache.size,
    newsApiConfigured: Boolean(NEWS_API_KEY),
    dataProvider: 'yahoo-finance2',
    marketStatus: getIndianMarketStatus(),
  });
});

// Fetch quotes for specified symbols (or top Indian stocks)
app.get('/api/quotes', async (req, res) => {
  try {
    const symbolArray = buildSymbolsList(
      req.query.symbols || INDIAN_STOCKS.topStocks.join(',')
    );
    const cacheKey = `quotes:${symbolArray.sort().join(',')}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const [quotes, sparkSnapshots] = await Promise.all([
      fetchQuotes(symbolArray),
      fetchSparkSnapshots(symbolArray),
    ]);
    const liveQuotes = mergeLiveQuoteData(quotes, sparkSnapshots);
    const marketStatus = getIndianMarketStatus();

    const response = {
      quoteResponse: { result: liveQuotes },
      meta: {
        provider: 'yahoo-finance2',
        refreshedAt: new Date().toISOString(),
        symbolCount: liveQuotes.length,
        marketStatus,
        livePriceSource: Object.keys(sparkSnapshots).length > 0 ? 'yahoo-spark' : 'yahoo-finance2-quote',
      },
    };

    cache.set(cacheKey, response, getLiveCacheTtl());
    res.set('Cache-Control', 'no-store');
    res.json(response);
  } catch (error) {
    console.error('Quotes API error:', error.message);
    res.status(500).json({
      error: 'Unable to fetch quote data',
      details: error.message,
    });
  }
});

// Fetch Indian market indices
app.get('/api/indices', async (req, res) => {
  try {
    const cached = cache.get('indices');
    if (cached) return res.json(cached);

    const symbols = [
      INDIAN_STOCKS.nifty50,
      INDIAN_STOCKS.sensex,
      INDIAN_STOCKS.niftyBank,
    ];

    const [quotes, sparkSnapshots] = await Promise.all([
      fetchQuotes(symbols),
      fetchSparkSnapshots(symbols),
    ]);
    const marketStatus = getIndianMarketStatus();

    const response = {
      quoteResponse: { result: mergeLiveQuoteData(quotes, sparkSnapshots) },
      meta: {
        provider: 'yahoo-finance2',
        refreshedAt: new Date().toISOString(),
        marketStatus,
        livePriceSource: Object.keys(sparkSnapshots).length > 0 ? 'yahoo-spark' : 'yahoo-finance2-quote',
      },
    };

    cache.set('indices', response, getLiveCacheTtl());
    res.set('Cache-Control', 'no-store');
    res.json(response);
  } catch (error) {
    console.error('Indices API error:', error.message);
    res.status(500).json({
      error: 'Unable to fetch index data',
      details: error.message,
    });
  }
});

// Fetch chart data for a specific symbol
app.get('/api/chart/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { range = '1d', interval = '5m' } = req.query;
    const cacheKey = `chart:${symbol}:${range}:${interval}`;
    const cached = cache.get(cacheKey);

    if (cached) return res.json(cached);

    const data = await fetchChart(symbol, range, interval);

    // yahoo-finance2 v3 returns: { meta, quotes: [{date, open, high, low, close, volume}] }
    const quotes = data.quotes || [];
    const timestamps = quotes.map((q) => Math.floor(new Date(q.date).getTime() / 1000));
    const closes = quotes.map((q) => q.close);
    const opens = quotes.map((q) => q.open);
    const highs = quotes.map((q) => q.high);
    const lows = quotes.map((q) => q.low);
    const volumes = quotes.map((q) => q.volume);

    const response = {
      chart: {
        result: [
          {
            meta: data.meta || {},
            timestamp: timestamps,
            indicators: {
              quote: [
                {
                  close: closes,
                  open: opens,
                  high: highs,
                  low: lows,
                  volume: volumes,
                },
              ],
            },
          },
        ],
      },
      meta: {
        provider: 'yahoo-finance2',
        symbol,
        range,
        interval,
        dataPoints: timestamps.length,
        refreshedAt: new Date().toISOString(),
      },
    };

    cache.set(cacheKey, response, CACHE_TTL.chart);
    res.set('Cache-Control', 'no-store');
    res.json(response);
  } catch (error) {
    console.error('Chart API error:', error.message);
    res.status(500).json({
      error: 'Unable to fetch chart data',
      details: error.message,
    });
  }
});

// Search for stocks
app.get('/api/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.json({ quotes: [] });
    }

    const cacheKey = `search:${q.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const data = await searchStocks(q);

    cache.set(cacheKey, data, CACHE_TTL.search);
    res.set('Cache-Control', 'no-store');
    res.json(data);
  } catch (error) {
    console.error('Search API error:', error.message);
    res.status(500).json({
      error: 'Unable to search stocks',
      details: error.message,
    });
  }
});

// Fetch market news
app.get('/api/news', async (req, res) => {
  const query = buildNewsQuery(
    req.query.query || req.query.symbol || '',
    req.query.category || 'all'
  );
  const category = String(req.query.category || 'all').toLowerCase();
  const cacheKey = `news:${query}:${category}`;

  try {
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    let news = [];
    let source = 'yahoo';

    // Try News API first
    try {
      news = await fetchNewsFromNewsApi(query);
      if (news.length > 0) source = 'newsapi';
    } catch (newsApiError) {
      console.error('News API error:', newsApiError.message);
      source = 'yahoo-fallback';
    }

    // Fallback to Yahoo Finance news
    if (news.length === 0) {
      news = await fetchNewsFromYahoo(query);
      source = source === 'newsapi' ? 'newsapi' : 'yahoo';
    }

    const response = {
      news,
      meta: {
        query,
        category,
        source,
        newsApiConfigured: Boolean(NEWS_API_KEY),
        count: news.length,
        note: NEWS_API_KEY
          ? 'News API key detected. Headlines are enriched with News API when available.'
          : 'No News API key. Using Yahoo Finance news. Add NEWS_API_KEY env var for richer news.',
      },
    };

    cache.set(cacheKey, response, CACHE_TTL.news);
    res.set('Cache-Control', 'no-store');
    res.json(response);
  } catch (error) {
    console.error('News API error:', error.message);
    res.status(500).json({
      error: 'Unable to fetch market news',
      details: error.message,
      meta: { query, category, newsApiConfigured: Boolean(NEWS_API_KEY) },
    });
  }
});

// Market summary — indices + breadth + leaders
app.get('/api/market-summary', async (req, res) => {
  try {
    const cached = cache.get('market-summary');
    if (cached) return res.json(cached);

    const indexSymbols = [INDIAN_STOCKS.nifty50, INDIAN_STOCKS.sensex, INDIAN_STOCKS.niftyBank];
    const [indicesRaw, stocksRaw, indexSpark, stockSpark] = await Promise.all([
      fetchQuotes(indexSymbols),
      fetchQuotes(INDIAN_STOCKS.topStocks),
      fetchSparkSnapshots(indexSymbols),
      fetchSparkSnapshots(INDIAN_STOCKS.topStocks),
    ]);
    const indices = mergeLiveQuoteData(indicesRaw, indexSpark);
    const stocks = mergeLiveQuoteData(stocksRaw, stockSpark);

    const advancing = stocks.filter(
      (stock) => (stock.regularMarketChangePercent || 0) >= 0
    ).length;
    const declining = stocks.length - advancing;
    const topGainer = [...stocks].sort(
      (a, b) => (b.regularMarketChangePercent || 0) - (a.regularMarketChangePercent || 0)
    )[0];
    const topLoser = [...stocks].sort(
      (a, b) => (a.regularMarketChangePercent || 0) - (b.regularMarketChangePercent || 0)
    )[0];

    const response = {
      indices,
      breadth: { advancing, declining },
      leaders: { topGainer, topLoser },
      generatedAt: new Date().toISOString(),
      marketStatus: getIndianMarketStatus(),
    };

    cache.set('market-summary', response, getLiveCacheTtl());
    res.set('Cache-Control', 'no-store');
    res.json(response);
  } catch (error) {
    console.error('Market summary error:', error.message);
    res.status(500).json({
      error: 'Unable to build market summary',
      details: error.message,
    });
  }
});

// Historical data for AI pages (uses chart() since historical() is deprecated in v3)
app.get('/api/historical/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '3mo' } = req.query;
    const cacheKey = `historical:${symbol}:${period}`;
    const cached = cache.get(cacheKey);

    if (cached) return res.json(cached);

    const period1 = getChartPeriod1(period);
    const chartResult = await yahooFinance.chart(symbol, {
      period1,
      interval: '1d',
    });

    const quotes = chartResult.quotes || [];

    const response = {
      symbol,
      period,
      data: quotes.map((row) => ({
        date: row.date,
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume,
        adjClose: row.adjclose,
      })),
      meta: {
        provider: 'yahoo-finance2',
        dataPoints: quotes.length,
        refreshedAt: new Date().toISOString(),
      },
    };

    cache.set(cacheKey, response, CACHE_TTL.chart);
    res.set('Cache-Control', 'no-store');
    res.json(response);
  } catch (error) {
    console.error('Historical API error:', error.message);
    res.status(500).json({
      error: 'Unable to fetch historical data',
      details: error.message,
    });
  }
});

// Clear cache (admin use)
app.post('/api/cache/clear', (_req, res) => {
  cache.clear();
  res.json({ status: 'cache cleared', timestamp: new Date().toISOString() });
});

// ──────────────────────────────────────
// Error handling middleware
// ──────────────────────────────────────

app.use((err, req, res, _next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

// ──────────────────────────────────────
// Server start
// ──────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 stock.io API running on port ${PORT}`);
  console.log(`   Provider: yahoo-finance2 library`);
  console.log(`   News API: ${NEWS_API_KEY ? '✅ Configured' : '⚠️  Not configured (Yahoo fallback active)'}`);
  console.log(`   Health:   http://localhost:${PORT}/api/health\n`);
});
