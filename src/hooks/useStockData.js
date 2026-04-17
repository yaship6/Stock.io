import { useState, useEffect, useCallback } from 'react';

// ──────────────────────────────────────
// Shared fetcher with error handling
// ──────────────────────────────────────

const fetchJson = async (url) => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
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
      setIndices(quotes);
      setError(null);
    } catch (e) {
      setError(e.message);
      console.error('Failed to fetch indices:', e.message);
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
      setStocks(quotes);
      setError(null);
    } catch (e) {
      setError(e.message);
      console.error('Failed to fetch stocks:', e.message);
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
      setNews(articles);
      setMeta(data?.meta || null);
      setError(null);
    } catch (e) {
      setError(e.message);
      setNews([]);
      setMeta({
        query: overrideQuery || 'Indian stock market',
        category: overrideCategory,
        source: 'error',
        newsApiConfigured: false,
        note: 'Unable to fetch news. Please check your server connection.',
      });
      console.error('Failed to fetch news:', e.message);
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
