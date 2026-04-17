import React, { useMemo, useState } from 'react';
import {
  Search,
  Newspaper,
  Clock,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Activity,
  BadgeInfo,
} from 'lucide-react';
import { useMarketNews } from '../hooks/useStockData';
import './News.css';

const categories = [
  { key: 'all', label: 'All' },
  { key: 'nifty50', label: 'Nifty 50' },
  { key: 'banking', label: 'Banking' },
  { key: 'it', label: 'IT' },
  { key: 'energy', label: 'Energy' },
  { key: 'fmcg', label: 'FMCG' },
  { key: 'auto', label: 'Auto' },
];

const timeAgo = (ts) => {
  const diff = (Date.now() / 1000) - ts;
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const getSentiment = (title = '') => {
  const positiveWords = ['surges', 'rises', 'high', 'profit', 'growth', 'strong', 'record', 'gains', 'up', 'beats'];
  const negativeWords = ['falls', 'drops', 'concern', 'tightens', 'loss', 'down', 'decline', 'crash', 'weak', 'misses'];
  const normalized = title.toLowerCase();
  if (positiveWords.some((word) => normalized.includes(word))) return 'positive';
  if (negativeWords.some((word) => normalized.includes(word))) return 'negative';
  return 'neutral';
};

const sentimentLabels = {
  positive: 'Bullish',
  negative: 'Bearish',
  neutral: 'Neutral',
};

const NewsCard = ({ article, featured = false }) => {
  const sentiment = getSentiment(article.title);

  return (
    <a href={article.link} target="_blank" rel="noopener noreferrer" className={`news-card ${featured ? 'featured' : ''}`}>
      {article.thumbnail && (
        <div className="news-thumb">
          <img src={article.thumbnail} alt={article.title} />
        </div>
      )}
      <div className="news-card-body">
        <div className="news-card-header">
          <div className="news-meta">
            <span className="news-publisher">{article.publisher}</span>
            <span className="news-dot">•</span>
            <span className="news-time"><Clock size={11} />{timeAgo(article.providerPublishTime)}</span>
          </div>
          <span className={`news-sentiment ${sentiment}`}>{sentimentLabels[sentiment]}</span>
        </div>
        <h3 className="news-title">{article.title}</h3>
        {article.summary && <p className="news-summary">{article.summary}</p>}
        {article.relatedTickers?.length > 0 && (
          <div className="news-tickers">
            {article.relatedTickers.slice(0, 4).map((ticker) => (
              <span key={ticker} className="news-ticker">{ticker.replace('.NS', '')}</span>
            ))}
          </div>
        )}
        <div className="news-read-more">Read full story <ExternalLink size={12} /></div>
      </div>
    </a>
  );
};

const News = () => {
  const [searchInput, setSearchInput] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const { news, loading, meta, refetch } = useMarketNews(submittedQuery, category);

  const displayedNews = news || [];
  const featuredArticle = displayedNews[0];
  const remainingArticles = displayedNews.slice(1);

  const sentimentBreakdown = useMemo(() => {
    const counts = { positive: 0, neutral: 0, negative: 0 };
    displayedNews.forEach((article) => {
      counts[getSentiment(article.title)] += 1;
    });
    const total = displayedNews.length || 1;
    return [
      { key: 'positive', label: 'Bullish', value: counts.positive, pct: Math.round((counts.positive / total) * 100) },
      { key: 'neutral', label: 'Neutral', value: counts.neutral, pct: Math.round((counts.neutral / total) * 100) },
      { key: 'negative', label: 'Bearish', value: counts.negative, pct: Math.round((counts.negative / total) * 100) },
    ];
  }, [displayedNews]);

  const trendingTickers = useMemo(() => {
    const counts = new Map();
    displayedNews.forEach((article) => {
      (article.relatedTickers || []).forEach((ticker) => {
        counts.set(ticker, (counts.get(ticker) || 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [displayedNews]);

  const handleSearch = (event) => {
    event.preventDefault();
    setSubmittedQuery(searchInput.trim());
    setLastUpdated(new Date());
  };

  const handleRefresh = async () => {
    await refetch(submittedQuery, category);
    setLastUpdated(new Date());
  };

  return (
    <div className="page-wrapper news-page">
      <div className="container news-shell">
        <div className="news-hero">
          <div className="news-hero-copy">
            <div className="section-label">Market News</div>
            <h1 className="section-title news-title-main">Live headlines with cleaner market context</h1>
            <p className="news-hero-subtitle">
              Search by stock, symbol, or sector. The backend can enrich stories through News API when
              `NEWS_API_KEY` is configured, and otherwise falls back to Yahoo Finance news results.
            </p>
          </div>
          <div className="news-hero-status">
            <div className="status-card">
              <span className="status-label">Source</span>
              <strong>{meta?.source || 'loading'}</strong>
            </div>
            <div className="status-card">
              <span className="status-label">Query</span>
              <strong>{meta?.query || 'Indian stock market'}</strong>
            </div>
            <div className="status-card">
              <span className="status-label">Updated</span>
              <strong>{lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="news-search">
          <div className="input-wrap" style={{ flex: 1 }}>
            <Search size={16} className="input-icon" />
            <input
              className="input input-with-icon"
              placeholder="Search RELIANCE, Infosys, RBI, banking, IT sector..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">
            Search News
          </button>
          <button type="button" className="btn-secondary" onClick={handleRefresh}>
            <RefreshCw size={14} /> Refresh
          </button>
        </form>

        <div className="news-categories">
          {categories.map((item) => (
            <button key={item.key} className={`cat-pill ${category === item.key ? 'active' : ''}`} onClick={() => setCategory(item.key)}>
              {item.label}
            </button>
          ))}
        </div>

        {meta?.note && (
          <div className="news-note">
            <BadgeInfo size={16} />
            <span>{meta.note}</span>
          </div>
        )}

        {loading ? (
          <div className="loading-wrap">
            <div className="spinner" />
          </div>
        ) : displayedNews.length === 0 ? (
          <div className="empty-state news-empty">
            <Newspaper size={48} style={{ marginBottom: 16 }} />
            <p>No news found for this combination of query and category.</p>
          </div>
        ) : (
          <>
            <div className="news-layout">
              <div className="news-primary">
                {featuredArticle && <NewsCard article={featuredArticle} featured />}
                <div className="news-grid">
                  {remainingArticles.map((article, index) => (
                    <NewsCard key={`${article.link}-${index}`} article={article} />
                  ))}
                </div>
              </div>

              <aside className="news-sidebar">
                <div className="news-side-card">
                  <div className="news-side-head">
                    <Sparkles size={16} />
                    <span>Sentiment Mix</span>
                  </div>
                  <div className="sentiment-bar-wrap">
                    {sentimentBreakdown.map((item) => (
                      <div key={item.key} className="sentiment-item">
                        <div className="sentiment-labels">
                          <span>{item.label}</span>
                          <span>{item.pct}%</span>
                        </div>
                        <div className="sentiment-bar">
                          <div className={`sentiment-fill ${item.key}`} style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="news-side-card">
                  <div className="news-side-head">
                    <Activity size={16} />
                    <span>Trending Tickers</span>
                  </div>
                  {trendingTickers.length === 0 ? (
                    <div className="empty-inline">No ticker tags were available in the current result set.</div>
                  ) : (
                    <div className="trending-list">
                      {trendingTickers.map(([ticker, count]) => (
                        <div key={ticker} className="trending-row">
                          <strong>{ticker.replace('.NS', '')}</strong>
                          <span>{count} mentions</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default News;
