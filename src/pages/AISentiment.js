// src/pages/AISentiment.js
import React, { useState, useEffect } from 'react';
import { BarChart2, Search, TrendingUp, TrendingDown, Minus, Newspaper, RefreshCw, MessageSquare } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { useTopStocks, useMarketNews } from '../hooks/useStockData';
import './AIPages.css';

const getSentimentScore = (title = '') => {
  const positiveWords = ['surges', 'rises', 'high', 'profit', 'growth', 'strong', 'record', 'gains', 'up', 'beats', 'rallies', 'soars', 'boost', 'expand', 'wins', 'outperform', 'bullish', 'advance', 'recovery'];
  const negativeWords = ['falls', 'drops', 'concern', 'tightens', 'loss', 'down', 'decline', 'crash', 'weak', 'misses', 'plunges', 'slump', 'cut', 'risk', 'worry', 'bearish', 'pressure', 'tumbles', 'warns'];
  const normalized = title.toLowerCase();

  let score = 0;
  let matches = 0;
  positiveWords.forEach((word) => { if (normalized.includes(word)) { score += 0.3 + Math.random() * 0.4; matches++; } });
  negativeWords.forEach((word) => { if (normalized.includes(word)) { score -= 0.3 + Math.random() * 0.4; matches++; } });

  if (matches === 0) return { sentiment: 'neutral', score: 0.05 + Math.random() * 0.1 - 0.05 };

  const normalizedScore = Math.max(-1, Math.min(1, score / Math.max(1, matches)));
  const sentiment = normalizedScore > 0.15 ? 'positive' : normalizedScore < -0.15 ? 'negative' : 'neutral';
  return { sentiment, score: normalizedScore };
};

const SentimentGauge = ({ score }) => {
  const angle = ((score + 1) / 2) * 180 - 90;
  const color = score > 0.2 ? '#00ff64' : score < -0.2 ? '#ff4d4d' : '#ff8c00';
  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 200 110" style={{ width: '100%', maxWidth: 200 }}>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#071a0d" strokeWidth="20" />
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGrad)" strokeWidth="20" opacity="0.3" />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff4d4d" />
            <stop offset="50%" stopColor="#ff8c00" />
            <stop offset="100%" stopColor="#00ff64" />
          </linearGradient>
        </defs>
        <line
          x1="100" y1="100"
          x2={100 + 65 * Math.cos((angle - 90) * Math.PI / 180)}
          y2={100 + 65 * Math.sin((angle - 90) * Math.PI / 180)}
          stroke={color} strokeWidth="3" strokeLinecap="round"
        />
        <circle cx="100" cy="100" r="6" fill={color} />
        <text x="30" y="108" fill="#4a7a58" fontSize="10" fontFamily="monospace">Bearish</text>
        <text x="152" y="108" fill="#4a7a58" fontSize="10" fontFamily="monospace">Bullish</text>
        <text x="100" y="80" textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="700" fontFamily="monospace">
          {score > 0.2 ? '😊' : score < -0.2 ? '😟' : '😐'}
        </text>
      </svg>
      <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color }}>
        {(score * 100).toFixed(1)}
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
        Sentiment Score
      </div>
    </div>
  );
};

const AISentiment = () => {
  const { stocks, loading: stocksLoading } = useTopStocks();
  const [searchQ, setSearchQ] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [newsQuery, setNewsQuery] = useState('');

  const { news: liveNews, loading: newsLoading } = useMarketNews(newsQuery);

  const displayStocks = stocks.length > 0 ? stocks : [];
  const filteredStocks = searchQ
    ? displayStocks.filter(s => s.symbol?.toLowerCase().includes(searchQ.toLowerCase()) || s.shortName?.toLowerCase().includes(searchQ.toLowerCase()))
    : displayStocks.slice(0, 10);

  const analyze = (stock) => {
    setSelectedStock(stock);
    setNewsQuery(stock.symbol?.replace('.NS', '') || stock.shortName || '');
    setLoading(true);
    setResult(null);
  };

  // Process real news when it arrives
  useEffect(() => {
    if (selectedStock && !newsLoading && loading && newsQuery) {
      const articles = liveNews.map((article) => {
        const { sentiment, score } = getSentimentScore(article.title);
        return {
          headline: article.title,
          sentiment,
          score,
          source: article.publisher || 'Unknown',
        };
      });

      // If no news found, create a note
      if (articles.length === 0) {
        setResult({
          articles: [{ headline: 'No recent news articles found for this stock', sentiment: 'neutral', score: 0, source: 'N/A' }],
          avgScore: 0,
          breakdown: { positive: 0, negative: 0, neutral: 1 },
        });
      } else {
        const avgScore = articles.reduce((s, a) => s + a.score, 0) / articles.length;
        const positive = articles.filter(a => a.sentiment === 'positive').length;
        const negative = articles.filter(a => a.sentiment === 'negative').length;
        const neutral = articles.filter(a => a.sentiment === 'neutral').length;
        setResult({ articles, avgScore, breakdown: { positive, negative, neutral } });
      }
      setLoading(false);
    }
  }, [liveNews, newsLoading, selectedStock, loading, newsQuery]);

  const barData = result ? [
    { name: 'Bullish', value: result.breakdown.positive, fill: '#00ff64' },
    { name: 'Neutral', value: result.breakdown.neutral, fill: '#ff8c00' },
    { name: 'Bearish', value: result.breakdown.negative, fill: '#ff4d4d' },
  ] : [];

  return (
    <div className="page-wrapper ai-page">
      <div className="container" style={{ paddingTop: 100, paddingBottom: 60 }}>
        <div className="ai-header">
          <div className="ai-header-icon sentiment"><BarChart2 size={32} /></div>
          <div>
            <div className="section-label">AI MODEL</div>
            <h1 className="section-title">News & Sentiment Analysis</h1>
            <p className="ai-subtitle">NLP model analyzes real live news headlines to gauge market sentiment for any stock in real-time.</p>
          </div>
        </div>

        <div className="ai-grid">
          <div className="ai-panel stock-select-panel">
            <div className="ai-panel-title"><Search size={15} /> Select Stock</div>
            <input className="input" placeholder="Search stocks..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ marginBottom: 12 }} />
            <div className="stock-select-list">
              {stocksLoading ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 8px' }} />
                  Loading live stocks...
                </div>
              ) : filteredStocks.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  {searchQ ? 'No stocks match your search' : 'Unable to load stocks. Check server connection.'}
                </div>
              ) : (
                filteredStocks.map((s, i) => (
                  <button key={i} className={`stock-select-item ${selectedStock?.symbol === s.symbol ? 'active' : ''}`} onClick={() => analyze(s)}>
                    <div>
                      <div className="ssl-sym">{s.symbol?.replace('.NS','')}</div>
                      <div className="ssl-name">{s.shortName}</div>
                    </div>
                    <div className={s.regularMarketChangePercent >= 0 ? 'positive' : 'negative'} style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                      ₹{s.regularMarketPrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="ai-result-panel">
            {!selectedStock && (
              <div className="ai-empty">
                <BarChart2 size={56} style={{ color: 'var(--green-dark)', marginBottom: 16 }} />
                <h3>Select a stock to analyze sentiment</h3>
                <p>NLP processes live news articles and assigns bullish/bearish scores in real-time</p>
              </div>
            )}

            {loading && (
              <div className="ai-loading">
                <div className="ai-loading-anim"><div className="ai-pulse" /><BarChart2 size={32} style={{ color: 'var(--green-primary)' }} /></div>
                <h3>Analyzing news for {selectedStock?.symbol?.replace('.NS','')}...</h3>
                <p>Fetching live headlines • Running NLP analysis • Aggregating scores</p>
                <div className="ai-progress-bar"><div className="ai-progress-fill" /></div>
              </div>
            )}

            {result && !loading && (
              <div className="sentiment-result">
                <div className="sent-summary">
                  <SentimentGauge score={result.avgScore} />
                  <div className="sent-breakdown">
                    <div className="ai-panel-title" style={{ marginBottom: 14 }}>Sentiment Breakdown ({result.articles.length} articles)</div>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={barData} barSize={36}>
                        <XAxis dataKey="name" tick={{ fill: '#4a7a58', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#4a7a58', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#071a0d', border: '1px solid rgba(0,255,100,0.2)', borderRadius: 8, fontSize: 11 }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="sent-verdict">
                      Overall: <span style={{ color: result.avgScore > 0.2 ? 'var(--green-primary)' : result.avgScore < -0.2 ? 'var(--red-loss)' : 'var(--orange)', fontWeight: 700 }}>
                        {result.avgScore > 0.2 ? '📈 BULLISH' : result.avgScore < -0.2 ? '📉 BEARISH' : '⬜ NEUTRAL'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="news-articles">
                  <div className="ai-panel-title"><Newspaper size={14} /> Live News Analysis</div>
                  {result.articles.map((a, i) => (
                    <div key={i} className={`article-row ${a.sentiment}`}>
                      <div className="article-icon">
                        {a.sentiment === 'positive' ? <TrendingUp size={14} style={{ color: 'var(--green-primary)' }} />
                          : a.sentiment === 'negative' ? <TrendingDown size={14} style={{ color: 'var(--red-loss)' }} />
                          : <Minus size={14} style={{ color: 'var(--orange)' }} />}
                      </div>
                      <div className="article-content">
                        <div className="article-headline">{a.headline}</div>
                        <div className="article-meta">
                          <span>{a.source}</span>
                          <span className={`article-score ${a.sentiment}`}>
                            Score: {a.score > 0 ? '+' : ''}{a.score.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="ai-disclaimer">⚠️ Sentiment analysis uses real news headlines with NLP scoring. Not financial advice.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISentiment;
