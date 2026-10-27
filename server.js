require('dotenv').config();
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

const rawNewsApiKey = process.env.NEWS_API_KEY || '';
const NEWS_API_KEY = (rawNewsApiKey && !rawNewsApiKey.includes('your_news_api_key_here') && rawNewsApiKey.trim().length > 10)
  ? rawNewsApiKey.trim()
  : '';
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
  all: 'Indian stock market Sensex Nifty equities',
  nifty50: 'Nifty 50 NSE India equities market',
  banking: 'Indian banking stocks HDFC Bank ICICI SBI RBI',
  it: 'Indian IT stocks TCS Infosys Wipro HCLTech',
  energy: 'Indian energy stocks Reliance Oil Gas renewable',
  fmcg: 'Indian FMCG stocks ITC Hindustan Unilever Nestle',
  auto: 'Indian auto stocks Tata Motors Maruti Suzuki Mahindra',
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
    if (/^[A-Z0-9.^]+(\.(NS|BO))?$/i.test(trimmed)) {
      const entity = symbolToEntity(trimmed);
      return entity && entity !== trimmed ? `${entity} stock` : `${trimmed} stock`;
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
// Financial Sentiment Analyzer
// ──────────────────────────────────────

const calculateSentiment = (title = '', summary = '') => {
  const combined = `${title} ${summary}`.toLowerCase();
  let score = 0;

  // Key phrase boosters
  if (/snaps?\s+(?:\d+-day\s+)?(?:fall|drop|losing\s+streak|slump)/i.test(combined)) score += 0.8;
  if (/ends?\s+in\s+green/i.test(combined)) score += 0.8;
  if (/(?:all-time|record|multi-year|52-week)\s+high/i.test(combined)) score += 1.0;
  if (/(?:all-time|record|multi-year|52-week)\s+low/i.test(combined)) score -= 1.0;
  if (/(?:receives?|bags?|wins?)\s+(?:mega\s+)?order/i.test(combined)) score += 0.9;
  if (/(?:mega|blockbuster|bumper)\s+(?:ipo|order|listing|debut)/i.test(combined)) score += 0.8;
  if (/(?:order\s+win|contract\s+win|bonus\s+issue|target\s+price\s+upgrad|multibagger)/i.test(combined)) score += 0.9;
  if (/(?:stock|shares?)\s+(?:surge|rally|jump|rise|advance|soar|climb)/i.test(combined)) score += 0.9;
  if (/(?:stock|shares?)\s+(?:fall|drop|plunge|tumble|slump|decline|slide)/i.test(combined)) score -= 0.9;
  if (/(?:buying|inflows?|demand)\s+lifts?/i.test(combined)) score += 0.8;
  if (/(?:selling|outflows?|pressure)\s+weighs?/i.test(combined)) score -= 0.8;
  if (/(?:profit\s+rises|profit\s+jumps|profit\s+surges|revenue\s+up|earnings\s+beat)/i.test(combined)) score += 1.0;
  if (/(?:profit\s+falls|profit\s+drops|loss\s+widens|revenue\s+down|earnings\s+miss)/i.test(combined)) score -= 1.0;
  if (/(?:sebi\s+probe|ed\s+raid|tax\s+evasion|accounting\s+fraud)/i.test(combined)) score -= 1.2;

  const strongPos = [
    'surge', 'surges', 'surged', 'surging', 'rally', 'rallies', 'rallied', 'rallying',
    'jump', 'jumps', 'jumped', 'jumping', 'soar', 'soars', 'soared', 'soaring',
    'skyrocket', 'skyrockets', 'skyrocketing', 'outperform', 'outperforms', 'outperforming',
    'blockbuster', 'stellar', 'multibagger', 'breakout', 'superhit'
  ];
  const modPos = [
    'gain', 'gains', 'gained', 'gaining', 'rise', 'rises', 'rose', 'rising',
    'profit', 'profits', 'profitable', 'growth', 'boost', 'boosts', 'boosted',
    'up', 'beat', 'beats', 'upgrade', 'upgrades', 'upgraded', 'buy', 'bullish',
    'bull', 'rebound', 'rebounds', 'rebounded', 'green', 'advance', 'advances',
    'recovery', 'recovers', 'recovered', 'high', 'higher', 'dividend', 'expansion',
    'turnaround', 'positive', 'optimism', 'cheer', 'tailwind', 'overweight',
    'order', 'orders', 'deal', 'deals', 'ipo', 'debut', 'inflows', 'demand', 'win', 'wins'
  ];

  const strongNeg = [
    'crash', 'crashes', 'crashed', 'crashing', 'plunge', 'plunges', 'plunged', 'plunging',
    'slump', 'slumps', 'slumped', 'slumping', 'fraud', 'scam', 'default', 'defaulted',
    'bankrupt', 'bankruptcy', 'crisis', 'penalty', 'probe', 'probes', 'raid', 'raids',
    'scandal', 'meltdown', 'collapse', 'collapses'
  ];
  const modNeg = [
    'fall', 'falls', 'fell', 'falling', 'drop', 'drops', 'dropped', 'dropping',
    'decline', 'declines', 'declined', 'declining', 'loss', 'losses', 'losing', 'lost',
    'tumble', 'tumbles', 'tumbled', 'tumbling', 'slip', 'slips', 'slipped', 'slipping',
    'weak', 'weaker', 'weakness', 'drag', 'drags', 'dragged', 'miss', 'misses', 'missed',
    'cut', 'cuts', 'down', 'sell', 'selling', 'downgrade', 'downgrades', 'downgraded', 'bearish',
    'bear', 'bears', 'concern', 'concerns', 'worries', 'worry', 'risk', 'risks', 'risky',
    'red', 'underweight', 'underperform', 'slowdown', 'inflation', 'deficit', 'fine', 'fined',
    'headwind', 'dispute', 'struggle', 'struggles', 'dip', 'debt'
  ];

  const words = combined.match(/\b[a-z0-9-]+\b/g) || [];
  for (const w of words) {
    if (strongPos.includes(w)) score += 1.0;
    else if (modPos.includes(w)) score += 0.45;
    else if (strongNeg.includes(w)) score -= 1.0;
    else if (modNeg.includes(w)) score -= 0.45;
  }

  // Double weight for title words
  if (title) {
    const titleWords = title.toLowerCase().match(/\b[a-z0-9-]+\b/g) || [];
    for (const tw of titleWords) {
      if (strongPos.includes(tw)) score += 0.6;
      else if (modPos.includes(tw)) score += 0.3;
      else if (strongNeg.includes(tw)) score -= 0.6;
      else if (modNeg.includes(tw)) score -= 0.3;
    }
  }

  let normScore = 0;
  if (score !== 0) {
    normScore = Math.max(-1, Math.min(1, score / (Math.abs(score) > 1.2 ? Math.sqrt(Math.abs(score) + 1) : 1.5)));
  }

  const sentiment = normScore > 0.12 ? 'positive' : normScore < -0.12 ? 'negative' : 'neutral';
  const label = sentiment === 'positive' ? 'Bullish' : sentiment === 'negative' ? 'Bearish' : 'Neutral';

  return {
    sentiment,
    sentimentScore: parseFloat(normScore.toFixed(2)),
    sentimentLabel: label,
  };
};

// ──────────────────────────────────────
// News Fetchers (Multi-Source Resilience)
// ──────────────────────────────────────

const mapNewsApiArticle = (article, query) => {
  const title = article.title || '';
  const summary = article.description || article.content || '';
  const { sentiment, sentimentScore, sentimentLabel } = calculateSentiment(title, summary);

  return {
    title,
    summary,
    publisher: article.source?.name || 'News API',
    link: article.url,
    providerPublishTime: article.publishedAt
      ? Math.floor(new Date(article.publishedAt).getTime() / 1000)
      : Math.floor(Date.now() / 1000),
    relatedTickers: [],
    thumbnail: article.urlToImage || '',
    sourceType: 'newsapi',
    query,
    sentiment,
    sentimentScore,
    sentimentLabel,
  };
};

const fetchNewsFromNewsApi = async (query, pageSize = 20) => {
  if (!NEWS_API_KEY) return [];

  try {
    const response = await axios.get(NEWS_API_URL, {
      params: {
        q: query,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize,
        searchIn: 'title,description',
      },
      headers: { 'X-Api-Key': NEWS_API_KEY },
      timeout: 10000,
    });

    return (response.data?.articles || [])
      .filter((article) => article.title && article.url)
      .map((article) => mapNewsApiArticle(article, query));
  } catch (err) {
    console.warn('News API error:', err.response?.data?.message || err.message);
    return [];
  }
};

const fetchNewsFromGoogleRss = async (queryTopic = 'Indian stock market', count = 25) => {
  try {
    const encoded = encodeURIComponent(queryTopic);
    const url = `https://news.google.com/rss/search?q=${encoded}&hl=en-IN&gl=IN&ceid=IN:en`;
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(response.data)) !== null && items.length < count) {
      const itemXml = match[1];
      const titleMatch = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i.exec(itemXml);
      const linkMatch = /<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i.exec(itemXml);
      const pubDateMatch = /<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i.exec(itemXml);
      const descMatch = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i.exec(itemXml);
      const sourceMatch = /<source[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/source>/i.exec(itemXml);

      let fullTitle = titleMatch ? titleMatch[1].trim() : '';
      fullTitle = fullTitle
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

      let publisher = sourceMatch ? sourceMatch[1].trim().replace(/&amp;/g, '&') : '';
      let cleanTitle = fullTitle;
      if (publisher && cleanTitle.endsWith(` - ${publisher}`)) {
        cleanTitle = cleanTitle.substring(0, cleanTitle.length - (publisher.length + 3)).trim();
      } else if (!publisher && cleanTitle.includes(' - ')) {
        const parts = cleanTitle.split(' - ');
        publisher = parts.pop().trim();
        cleanTitle = parts.join(' - ').trim();
      }

      let summary = '';
      if (descMatch) {
        summary = descMatch[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ')
          .trim();
        if (summary === cleanTitle || summary === fullTitle) {
          summary = '';
        }
      }

      const pubTime = pubDateMatch
        ? Math.floor(new Date(pubDateMatch[1]).getTime() / 1000)
        : Math.floor(Date.now() / 1000);

      if (cleanTitle) {
        const { sentiment, sentimentScore, sentimentLabel } = calculateSentiment(cleanTitle, summary);
        items.push({
          title: cleanTitle,
          summary: summary || cleanTitle,
          publisher: publisher || 'Financial News',
          link: linkMatch ? linkMatch[1].trim() : '',
          providerPublishTime: isNaN(pubTime) ? Math.floor(Date.now() / 1000) : pubTime,
          relatedTickers: [],
          thumbnail: '',
          sourceType: 'google-rss',
          sentiment,
          sentimentScore,
          sentimentLabel,
        });
      }
    }
    return items;
  } catch (err) {
    console.error('Google News RSS error:', err.message);
    return [];
  }
};

const fetchNewsFromYahoo = async (query) => {
  try {
    const cleanQuery = String(query || '')
      .replace(/\.(NS|BO)$/i, '')
      .replace(/\b(OR|AND|NOT)\b/gi, ' ')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 3)
      .join(' ') || 'Nifty';

    const result = await yahooFinance.search(cleanQuery, {
      quotesCount: 0,
      newsCount: 20,
    });

    return (result.news || []).map((item) => {
      const title = item.title || '';
      const summary = item.summary || item.snippet || '';
      const { sentiment, sentimentScore, sentimentLabel } = calculateSentiment(title, summary);

      return {
        title,
        summary,
        publisher: item.publisher || 'Yahoo Finance',
        link: item.link,
        providerPublishTime: item.providerPublishTime || Math.floor(Date.now() / 1000),
        relatedTickers: Array.isArray(item.relatedTickers) ? item.relatedTickers : [],
        thumbnail:
          item.thumbnail?.resolutions?.[0]?.url ||
          item.thumbnail?.originalUrl ||
          '',
        sourceType: 'yahoo',
        sentiment,
        sentimentScore,
        sentimentLabel,
      };
    });
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

    let articles = [];
    let sourcesUsed = [];

    // 1. Try News API if key is present
    if (NEWS_API_KEY) {
      try {
        const newsApiItems = await fetchNewsFromNewsApi(query);
        if (newsApiItems.length > 0) {
          articles.push(...newsApiItems);
          sourcesUsed.push('newsapi');
        }
      } catch (err) {
        console.warn('News API fetch failed:', err.message);
      }
    }

    // 2. Fetch from Google News RSS (always reliable and rich)
    try {
      const rssItems = await fetchNewsFromGoogleRss(query);
      if (rssItems.length > 0) {
        articles.push(...rssItems);
        sourcesUsed.push('google-rss');
      }
    } catch (rssErr) {
      console.warn('Google News RSS fetch failed:', rssErr.message);
    }

    // 3. If needed, supplement with Yahoo Finance news
    if (articles.length < 15) {
      try {
        const yahooItems = await fetchNewsFromYahoo(query);
        if (yahooItems.length > 0) {
          articles.push(...yahooItems);
          sourcesUsed.push('yahoo');
        }
      } catch (yahooErr) {
        console.warn('Yahoo news fetch failed:', yahooErr.message);
      }
    }

    // Deduplicate articles by normalized title
    const seenTitles = new Set();
    const deduplicated = [];

    for (const item of articles) {
      const key = (item.title || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 50);

      if (key && !seenTitles.has(key)) {
        seenTitles.add(key);
        // Ensure sentiment is populated
        if (!item.sentiment || item.sentimentScore === undefined) {
          const sent = calculateSentiment(item.title, item.summary);
          item.sentiment = sent.sentiment;
          item.sentimentScore = sent.sentimentScore;
          item.sentimentLabel = sent.sentimentLabel;
        }
        deduplicated.push(item);
      }
    }

    // Sort by publication time (newest first)
    deduplicated.sort((a, b) => (b.providerPublishTime || 0) - (a.providerPublishTime || 0));

    const finalNews = deduplicated.slice(0, 30);
    const sourceSummary = sourcesUsed.length > 0 ? sourcesUsed.join(' + ') : 'google-rss';

    const response = {
      news: finalNews,
      meta: {
        query,
        category,
        source: sourceSummary,
        newsApiConfigured: Boolean(NEWS_API_KEY),
        count: finalNews.length,
        note: NEWS_API_KEY
          ? `Active News API key detected. Combined with live Indian market feeds (${finalNews.length} articles).`
          : `Live Indian market news active via real-time feeds (${finalNews.length} articles). Add NEWS_API_KEY for additional global wire stories.`,
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
