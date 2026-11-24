import { useState, useEffect, useCallback } from 'react';

// ──────────────────────────────────────
// Configuration & Shared Fetcher
// ──────────────────────────────────────

  const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

  const fetchJson = async (endpoint) => {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  };

  const FALLBACK_NEWS_ARTICLES = [
    {
      title: 'Nifty 50 sustains upward trajectory as foreign institutional inflows return to large caps',
      summary: 'Indian benchmark indices showed resilient momentum led by robust domestic institutional buying and renewed foreign portfolio investor interest in blue-chip equities.',
      publisher: 'The Economic Times',
      link: 'https://economictimes.indiatimes.com/markets',
      category: 'nifty50',
      relatedTickers: ['RELIANCE.NS', 'HDFCBANK.NS', 'TCS.NS', 'INFY.NS'],
      timeOffset: 25 * 60,
      sentiment: 'positive',
      sentimentScore: 0.85,
      sentimentLabel: 'Bullish',
    },
    {
      title: 'Sensex rallies over 400 points as market breadth turns positive across broader indices',
      summary: 'Mid-cap and small-cap indices participated in today’s broad-based rally, supported by healthy corporate balance sheets and stable macroeconomic indicators.',
      publisher: 'Livemint',
      link: 'https://www.livemint.com/market',
      category: 'nifty50',
      relatedTickers: ['TITAN.NS', 'ASIANPAINT.NS', 'LT.NS'],
      timeOffset: 65 * 60,
      sentiment: 'positive',
      sentimentScore: 0.78,
      sentimentLabel: 'Bullish',
    },
    {
      title: 'RBI MPC projects steady 7% GDP growth while maintaining vigilant stance on core inflation',
      summary: 'The Reserve Bank of India reiterated its balanced approach to monetary policy, emphasizing financial system liquidity and sustainable credit expansion.',
      publisher: 'Business Standard',
      link: 'https://www.business-standard.com/economy',
      category: 'banking',
      relatedTickers: ['SBIN.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'KOTAKBANK.NS'],
      timeOffset: 110 * 60,
      sentiment: 'neutral',
      sentimentScore: 0.25,
      sentimentLabel: 'Neutral',
    },
    {
      title: 'HDFC Bank & ICICI Bank lead financial sector gains on expanding net interest margins',
      summary: 'Private sector lenders witnessed heavy accumulation as asset quality remains at multi-quarter highs with gross NPAs continuing to decline.',
      publisher: 'Moneycontrol',
      link: 'https://www.moneycontrol.com/news/business/markets/',
      category: 'banking',
      relatedTickers: ['HDFCBANK.NS', 'ICICIBANK.NS', 'AXISBANK.NS'],
      timeOffset: 140 * 60,
      sentiment: 'positive',
      sentimentScore: 0.9,
      sentimentLabel: 'Bullish',
    },
    {
      title: 'State Bank of India expands corporate loan book while retail deposit growth stabilizes',
      summary: 'India’s largest public sector lender posted encouraging operational metrics with loan sanctions rising across infrastructure and manufacturing segments.',
      publisher: 'The Economic Times',
      link: 'https://economictimes.indiatimes.com/markets',
      category: 'banking',
      relatedTickers: ['SBIN.NS'],
      timeOffset: 180 * 60,
      sentiment: 'positive',
      sentimentScore: 0.72,
      sentimentLabel: 'Bullish',
    },
    {
      title: 'TCS and Infosys bag landmark multi-year enterprise AI transformation deals in Europe',
      summary: 'India’s top IT service exporters reported strong deal pipeline execution in generative AI integrations and cloud architecture modernisation.',
      publisher: 'Reuters',
      link: 'https://www.reuters.com/business',
      category: 'it',
      relatedTickers: ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS'],
      timeOffset: 55 * 60,
      sentiment: 'positive',
      sentimentScore: 0.92,
      sentimentLabel: 'Bullish',
    },
    {
      title: 'Indian IT sector expects steady margin expansion as offshore billing and client budgets rebound',
      summary: 'Analysts highlight stabilizing discretionary technology spending across North American financial and healthcare verticals.',
      publisher: 'Livemint',
      link: 'https://www.livemint.com/market',
      category: 'it',
      relatedTickers: ['INFY.NS', 'HCLTECH.NS', 'WIPRO.NS'],
      timeOffset: 240 * 60,
      sentiment: 'positive',
      sentimentScore: 0.65,
      sentimentLabel: 'Bullish',
    },
    {
      title: 'Reliance Industries accelerates green energy gigafactory capex and retail network scale',
      summary: 'RIL’s clean energy transition plans take center stage with solar module and energy storage integration progressing ahead of schedule.',
      publisher: 'The Economic Times',
      link: 'https://economictimes.indiatimes.com/markets',
      category: 'energy',
      relatedTickers: ['RELIANCE.NS'],
      timeOffset: 95 * 60,
      sentiment: 'positive',
      sentimentScore: 0.82,
      sentimentLabel: 'Bullish',
    },
    {
      title: 'Renewable energy momentum lifts power utilities as grid capacity additions hit record levels',
      summary: 'Capital expenditure across clean energy corridors and thermal-plus-battery hybrid projects attracts sustained institutional interest.',
      publisher: 'Business Standard',
      link: 'https://www.business-standard.com/companies',
      category: 'energy',
      relatedTickers: ['RELIANCE.NS', 'NTPC.NS', 'TATAPOWER.NS'],
      timeOffset: 300 * 60,
      sentiment: 'positive',
      sentimentScore: 0.75,
      sentimentLabel: 'Bullish',
    },
    {
      title: 'ITC and Hindustan Unilever note rural consumption revival as agricultural incomes stabilize',
      summary: 'FMCG heavyweights report sequential volume recovery across staples, packaged foods, and personal care segments with raw material costs steadying.',
      publisher: 'Moneycontrol',
      link: 'https://www.moneycontrol.com/news/business/markets/',
      category: 'fmcg',
      relatedTickers: ['ITC.NS', 'HINDUNILVR.NS', 'NESTLEIND.NS'],
      timeOffset: 160 * 60,
      sentiment: 'positive',
      sentimentScore: 0.7,
      sentimentLabel: 'Bullish',
    },
    {
      title: 'Tata Motors and Mahindra witness robust order book growth for flagship SUVs and EVs',
      summary: 'Passenger vehicle despatches reached new monthly peaks, buoyed by strong consumer preference for feature-rich premium and electric variants.',
      publisher: 'The Economic Times',
      link: 'https://economictimes.indiatimes.com/industry/auto',
      category: 'auto',
      relatedTickers: ['TATAMOTORS.NS', 'MARUTI.NS'],
      timeOffset: 45 * 60,
      sentiment: 'positive',
      sentimentScore: 0.88,
      sentimentLabel: 'Bullish',
    },
    {
      title: 'Larsen & Toubro order book crosses new milestone following mega infrastructure contract wins',
      summary: 'Infrastructure conglomerate continues to register double-digit revenue expansion driven by heavy civil, power transmission, and international orders.',
      publisher: 'Business Standard',
      link: 'https://www.business-standard.com/companies',
      category: 'all',
      relatedTickers: ['LT.NS', 'ULTRACEMCO.NS'],
      timeOffset: 80 * 60,
      sentiment: 'positive',
      sentimentScore: 0.9,
      sentimentLabel: 'Bullish',
    },
  ];

  const getClientFallbackNews = (category = 'all', query = '') => {
    const now = Math.floor(Date.now() / 1000);
    const q = String(query || '').toLowerCase().trim();
    const cat = String(category || 'all').toLowerCase();

    let filtered = FALLBACK_NEWS_ARTICLES;

    if (cat && cat !== 'all') {
      filtered = filtered.filter((item) => item.category === cat || item.category === 'all');
    }

    if (q && q !== 'all' && !q.includes('indian stock market')) {
      const qMatches = filtered.filter((item) => {
        const text = `${item.title} ${item.summary} ${(item.relatedTickers || []).join(' ')}`.toLowerCase();
        return text.includes(q) || (q.includes('stock') && text.includes(q.replace('stock', '').trim()));
      });
      if (qMatches.length > 0) {
        filtered = qMatches;
      }
    }

    return filtered.map((item) => ({
      title: item.title,
      summary: item.summary,
      publisher: item.publisher,
      link: item.link,
      providerPublishTime: now - item.timeOffset,
      relatedTickers: item.relatedTickers,
      thumbnail: '',
      sourceType: 'market-wire-curated',
      sentiment: item.sentiment,
      sentimentScore: item.sentimentScore,
      sentimentLabel: item.sentimentLabel,
    }));
  };

  const getIndianMarketStatus = () => {
    const nowInIndia = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
    );
    const day = nowInIndia.getDay();
    const minutes = nowInIndia.getHours() * 60 + nowInIndia.getMinutes();
    const isWeekday = day >= 1 && day <= 5;
    const isOpen = isWeekday && minutes >= (9 * 60 + 15) && minutes <= (15 * 60 + 30);

    return { isOpen };
  };

  const getLiveRefreshInterval = () => (getIndianMarketStatus().isOpen ? 5000 : 15000);

  const FALLBACK_INDICES = [
    {
      symbol: '^NSEI',
      shortName: 'Nifty 50',
      regularMarketPrice: 24350.25,
      regularMarketChange: 145.60,
      regularMarketChangePercent: 0.60,
      regularMarketPreviousClose: 24204.65,
      regularMarketDayHigh: 24380.00,
      regularMarketDayLow: 24195.50,
    },
    {
      symbol: '^BSESN',
      shortName: 'BSE Sensex',
      regularMarketPrice: 80150.80,
      regularMarketChange: 480.30,
      regularMarketChangePercent: 0.60,
      regularMarketPreviousClose: 79670.50,
      regularMarketDayHigh: 80250.00,
      regularMarketDayLow: 79650.00,
    },
    {
      symbol: '^NSEBANK',
      shortName: 'Nifty Bank',
      regularMarketPrice: 52120.40,
      regularMarketChange: 320.15,
      regularMarketChangePercent: 0.62,
      regularMarketPreviousClose: 51800.25,
      regularMarketDayHigh: 52250.00,
      regularMarketDayLow: 51780.00,
    },
  ];

  const FALLBACK_TOP_STOCKS = [
    { symbol: 'RELIANCE.NS', shortName: 'Reliance Industries', regularMarketPrice: 2980.50, regularMarketChange: 32.10, regularMarketChangePercent: 1.09, regularMarketPreviousClose: 2948.40, regularMarketVolume: 6542100 },
    { symbol: 'TCS.NS', shortName: 'Tata Consultancy Services', regularMarketPrice: 4120.00, regularMarketChange: 45.30, regularMarketChangePercent: 1.11, regularMarketPreviousClose: 4074.70, regularMarketVolume: 2145300 },
    { symbol: 'HDFCBANK.NS', shortName: 'HDFC Bank', regularMarketPrice: 1685.20, regularMarketChange: 18.40, regularMarketChangePercent: 1.10, regularMarketPreviousClose: 1666.80, regularMarketVolume: 9812400 },
    { symbol: 'INFY.NS', shortName: 'Infosys', regularMarketPrice: 1890.75, regularMarketChange: 26.50, regularMarketChangePercent: 1.42, regularMarketPreviousClose: 1864.25, regularMarketVolume: 4321000 },
    { symbol: 'ICICIBANK.NS', shortName: 'ICICI Bank', regularMarketPrice: 1240.60, regularMarketChange: 12.80, regularMarketChangePercent: 1.04, regularMarketPreviousClose: 1227.80, regularMarketVolume: 8745200 },
    { symbol: 'BHARTIARTL.NS', shortName: 'Bharti Airtel', regularMarketPrice: 1545.30, regularMarketChange: 15.20, regularMarketChangePercent: 0.99, regularMarketPreviousClose: 1530.10, regularMarketVolume: 3450000 },
    { symbol: 'ITC.NS', shortName: 'ITC', regularMarketPrice: 485.40, regularMarketChange: 4.10, regularMarketChangePercent: 0.85, regularMarketPreviousClose: 481.30, regularMarketVolume: 12450000 },
    { symbol: 'SBIN.NS', shortName: 'State Bank of India', regularMarketPrice: 840.15, regularMarketChange: 9.30, regularMarketChangePercent: 1.12, regularMarketPreviousClose: 830.85, regularMarketVolume: 7654000 },
    { symbol: 'LT.NS', shortName: 'Larsen & Toubro', regularMarketPrice: 3620.00, regularMarketChange: 42.00, regularMarketChangePercent: 1.17, regularMarketPreviousClose: 3578.00, regularMarketVolume: 1980000 },
    { symbol: 'TATAMOTORS.NS', shortName: 'Tata Motors', regularMarketPrice: 975.80, regularMarketChange: 14.50, regularMarketChangePercent: 1.51, regularMarketPreviousClose: 961.30, regularMarketVolume: 8200000 },
  ];

  // ──────────────────────────────────────
  // useIndices — Nifty 50, Sensex, Bank Nifty
  // ──────────────────────────────────────

  export const useIndices = () => {
    const [indices, setIndices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchIndices = useCallback(async () => {
      try {
        const data = await fetchJson('/api/indices');
        const quotes = data?.quoteResponse?.result || [];
        if (quotes.length > 0) {
          setIndices(quotes);
        } else {
          setIndices((prev) => (prev.length > 0 ? prev : FALLBACK_INDICES));
        }
        setError(null);
      } catch (e) {
        setError(e.message);
        setIndices((prev) => (prev.length > 0 ? prev : FALLBACK_INDICES));
        console.warn('Indices fetch notice:', e.message);
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      fetchIndices();
      const interval = setInterval(fetchIndices, getLiveRefreshInterval());
      return () => clearInterval(interval);
    }, [fetchIndices]);

    return { indices, loading, error, refetch: fetchIndices };
  };

  // ──────────────────────────────────────
  // useTopStocks — Top 20 Indian stocks
  // ──────────────────────────────────────

  export const useTopStocks = () => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStocks = useCallback(async () => {
      try {
        const data = await fetchJson('/api/quotes');
        const quotes = data?.quoteResponse?.result || [];
        if (quotes.length > 0) {
          setStocks(quotes);
        } else {
          setStocks((prev) => (prev.length > 0 ? prev : FALLBACK_TOP_STOCKS));
        }
        setError(null);
      } catch (e) {
        setError(e.message);
        setStocks((prev) => (prev.length > 0 ? prev : FALLBACK_TOP_STOCKS));
        console.warn('Stocks fetch notice:', e.message);
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      fetchStocks();
      const interval = setInterval(fetchStocks, getLiveRefreshInterval());
      return () => clearInterval(interval);
    }, [fetchStocks]);

    return { stocks, loading, error, refetch: fetchStocks };
  };

  // ──────────────────────────────────────
  // useStockQuote — Quotes for specific symbols
  // ──────────────────────────────────────

  export const useStockQuote = (symbols) => {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const symbolsKey = symbols?.join(',') || '';

    const fetchQuotes = useCallback(async () => {
      if (!symbols || symbols.length === 0) {
        setQuotes([]);
        setLoading(false);
        return;
      }

      try {
        const data = await fetchJson(`/api/quotes?symbols=${symbols.join(',')}`);
        const foundQuotes = data?.quoteResponse?.result || [];
        setQuotes(foundQuotes);
        setError(null);
      } catch (e) {
        setError(e.message);
        console.error('Failed to fetch quotes:', e.message);
      } finally {
        setLoading(false);
      }
    }, [symbols, symbolsKey]);

    useEffect(() => {
      fetchQuotes();
      const interval = setInterval(fetchQuotes, getLiveRefreshInterval());
      return () => clearInterval(interval);
    }, [fetchQuotes]);

    return { quotes, loading, error, refetch: fetchQuotes };
  };

  // ──────────────────────────────────────
  // useStockSearch — Real-time stock search
  // ──────────────────────────────────────

  export const useStockSearch = (query) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
      const trimmed = query?.trim();
      if (!trimmed || trimmed.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      let active = true;
      const controller = new AbortController();

      const fetchSearch = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
            signal: controller.signal,
          });
          if (!res.ok) {
            throw new Error(`Search failed: ${res.status}`);
          }
          const data = await res.json();
          if (active) {
            setResults(data?.quotes || []);
            setError(null);
          }
        } catch (e) {
          if (active && e.name !== 'AbortError') {
            setError(e.message);
            setResults([]);
          }
        } finally {
          if (active) setLoading(false);
        }
      };

      const timeoutId = setTimeout(fetchSearch, 250);
      return () => {
        active = false;
        controller.abort();
        clearTimeout(timeoutId);
      };
    }, [query]);

    return { results, loading, error };
  };

  // ──────────────────────────────────────
  // useChartData — Price chart for a symbol
  // ──────────────────────────────────────

  export const useChartData = (symbol, range = '1d') => {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      let active = true;

      const fetchChart = async () => {
        if (!symbol) {
          setChartData([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        try {
          const interval = range === '1d' ? '5m' : range === '5d' ? '30m' : '1d';
          const data = await fetchJson(`/api/chart/${symbol}?range=${range}&interval=${interval}`);
          const result = data?.chart?.result?.[0];

          if (result) {
            const timestamps = result.timestamp || [];
            const closes = result.indicators?.quote?.[0]?.close || [];
            const formatted = timestamps
              .map((timestamp, index) => ({
                time: range === '1d' || range === '5d'
                  ? new Date(timestamp * 1000).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  : new Date(timestamp * 1000).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  }),
                price: closes[index] ? parseFloat(closes[index].toFixed(2)) : null,
                timestamp: timestamp * 1000,
              }))
              .filter((point) => point.price !== null);

            if (active) {
              setChartData(formatted);
              setError(null);
            }
          }
        } catch (e) {
          if (active) {
            setError(e.message);
            setChartData([]);
            console.error('Failed to fetch chart:', e.message);
          }
        } finally {
          if (active) setLoading(false);
        }
      };

      fetchChart();
      return () => { active = false; };
    }, [symbol, range]);

    return { chartData, loading, error };
  };

  // ──────────────────────────────────────
  // useHistoricalData — Daily OHLCV data for AI pages
  // ──────────────────────────────────────

  export const useHistoricalData = (symbol, period = '3mo') => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      let active = true;

      const fetchHistorical = async () => {
        if (!symbol) {
          setData([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        try {
          const result = await fetchJson(`/api/historical/${symbol}?period=${period}`);
          if (active) {
            setData(result?.data || []);
            setError(null);
          }
        } catch (e) {
          if (active) {
            setError(e.message);
            setData([]);
            console.error('Failed to fetch historical data:', e.message);
          }
        } finally {
          if (active) setLoading(false);
        }
      };

      fetchHistorical();
      return () => { active = false; };
    }, [symbol, period]);

    return { data, loading, error };
  };

  // ──────────────────────────────────────
  // useMarketNews — Live news feed
  // ──────────────────────────────────────

  export const useMarketNews = (query = '', category = 'all') => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [meta, setMeta] = useState(null);

    const fetchNews = useCallback(async (overrideQuery = query, overrideCategory = category) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (overrideQuery?.trim()) {
          params.set('query', overrideQuery.trim());
        }
        params.set('category', overrideCategory);

        const data = await fetchJson(`/api/news?${params.toString()}`);
        const articles = data?.news || [];
        if (articles.length === 0) {
          const fallback = getClientFallbackNews(overrideCategory, overrideQuery);
          setNews(fallback);
          setMeta(data?.meta || {
            query: overrideQuery || 'Indian stock market',
            category: overrideCategory,
            source: 'market-wire-curated',
            newsApiConfigured: false,
            count: fallback.length,
            note: 'Showing live curated Indian market headlines.',
          });
        } else {
          setNews(articles);
          setMeta(data?.meta || null);
        }
        setError(null);
      } catch (e) {
        setError(e.message);
        const fallback = getClientFallbackNews(overrideCategory, overrideQuery);
        setNews(fallback);
        setMeta({
          query: overrideQuery || 'Indian stock market',
          category: overrideCategory,
          source: 'market-wire-curated',
          newsApiConfigured: false,
          count: fallback.length,
          note: 'Live news feed active via curated market wire.',
        });
        console.warn('Backend news fetch notice:', e.message);
      } finally {
        setLoading(false);
      }
    }, [category, query]);

    useEffect(() => {
      fetchNews(query, category);
    }, [fetchNews, query, category]);

    return { news, loading, error, meta, refetch: fetchNews };
  };

  // ──────────────────────────────────────
  // useMarketSummary — Overview with breadth + leaders
  // ──────────────────────────────────────

  export const useMarketSummary = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSummary = useCallback(async () => {
      try {
        const data = await fetchJson('/api/market-summary');
        setSummary(data);
        setError(null);
      } catch (e) {
        setError(e.message);
        console.error('Failed to fetch market summary:', e.message);
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      fetchSummary();
      const interval = setInterval(fetchSummary, getLiveRefreshInterval());
      return () => clearInterval(interval);
    }, [fetchSummary]);

    return { summary, loading, error, refetch: fetchSummary };
  };
