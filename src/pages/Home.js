import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Brain,
  BarChart2,
  Shield,
  AlertTriangle,
  Zap,
  Globe,
  Lock,
  Sparkles,
  Newspaper,
  Activity,
} from 'lucide-react';
import { useIndices, useTopStocks, useMarketSummary } from '../hooks/useStockData';
import StockCard from '../components/StockCard';
import BuySellModal from '../components/BuySellModal';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const IndexCard = ({ data, delay = 0 }) => {
  if (!data) return null;
  const isPos = (data.regularMarketChangePercent || 0) >= 0;

  return (
    <motion.div
      className={`index-card ${isPos ? 'pos' : 'neg'}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.45, delay }}
    >
      <div className="index-name">{data.shortName}</div>
      <div className="index-price">{data.regularMarketPrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
      <div className={`index-change ${isPos ? 'pos' : 'neg'}`}>
        {isPos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{isPos ? '+' : ''}{data.regularMarketChange?.toFixed(2)}</span>
        <span>({isPos ? '+' : ''}{data.regularMarketChangePercent?.toFixed(2)}%)</span>
      </div>
      <div className="index-range">
        <span>H: {data.regularMarketDayHigh?.toFixed(2)}</span>
        <span>L: {data.regularMarketDayLow?.toFixed(2)}</span>
      </div>
    </motion.div>
  );
};

const Home = () => {
  const { indices, loading: indicesLoading } = useIndices();
  const { stocks, loading: stocksLoading } = useTopStocks();
  const { summary } = useMarketSummary();
  const { user } = useAuth();
  const [selectedStock, setSelectedStock] = useState(null);
  const [filter, setFilter] = useState('all');

  const filteredStocks = useMemo(() => {
    if (filter === 'gainers') {
      return [...stocks]
        .filter((stock) => stock.regularMarketChangePercent > 0)
        .sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent);
    }

    if (filter === 'losers') {
      return [...stocks]
        .filter((stock) => stock.regularMarketChangePercent < 0)
        .sort((a, b) => a.regularMarketChangePercent - b.regularMarketChangePercent);
    }

    return stocks;
  }, [filter, stocks]);

  const marketPulse = useMemo(() => {
    const breadth = summary?.breadth || { advancing: 0, declining: 0 };
    const leader = summary?.leaders?.topGainer;
    const laggard = summary?.leaders?.topLoser;
    return [
      {
        label: 'Advancers',
        value: breadth.advancing || '0',
        icon: <TrendingUp size={15} />,
      },
      {
        label: 'Decliners',
        value: breadth.declining || '0',
        icon: <TrendingDown size={15} />,
      },
      {
        label: 'Top Gainer',
        value: leader?.symbol?.replace('.NS', '') || 'Loading',
        icon: <Sparkles size={15} />,
      },
      {
        label: 'Top Loser',
        value: laggard?.symbol?.replace('.NS', '') || 'Loading',
        icon: <Activity size={15} />,
      },
    ];
  }, [summary]);

  const spotlightCards = useMemo(() => {
    const topThree = filteredStocks.slice(0, 3);
    return topThree.map((stock, index) => ({
      ...stock,
      angle: [-10, 8, -4][index] || 0,
    }));
  }, [filteredStocks]);

  return (
    <div className="page-wrapper">
      <section className="hero hero-modern">
        <div className="hero-bg">
          <div className="hero-orb orb1" />
          <div className="hero-orb orb2" />
          <div className="hero-orb orb3" />
          <div className="hero-grid" />
        </div>
        <div className="container hero-shell">
          <div className="hero-copy">
            <div className="hero-badge">
              <span className="badge badge-green">India-focused market intelligence</span>
            </div>
            <motion.h1
              className="hero-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Real-time trading context,
              <span className="hero-accent glow-text"> AI insight</span>,
              and market news in one live command center.
            </motion.h1>
            <motion.p
              className="hero-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              stock.io now blends Yahoo Finance market data with dedicated news aggregation, portfolio tracking,
              AI workflow pages, and a modern live interface tailored for NSE and BSE traders.
            </motion.p>
            <div className="hero-cta">
              {user ? (
                <Link to="/dashboard" className="btn-primary">
                  Open Dashboard <ArrowRight size={16} />
                </Link>
              ) : (
                <>
                  <Link to="/auth?mode=signup" className="btn-primary">
                    Start Trading Free <ArrowRight size={16} />
                  </Link>
                  <Link to="/news" className="btn-secondary">
                    Explore Market News <Newspaper size={16} />
                  </Link>
                </>
              )}
            </div>

            <div className="hero-pulse-grid">
              {marketPulse.map((item, index) => (
                <motion.div
                  key={item.label}
                  className="hero-pulse-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.15 + index * 0.08 }}
                >
                  <span>{item.icon}</span>
                  <strong>{item.value}</strong>
                  <small>{item.label}</small>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            className="hero-scene"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <div className="scene-shell">
              <div className="scene-grid" />
              <div className="scene-rings">
                <span />
                <span />
                <span />
              </div>
              <div className="scene-dashboard">
                <div className="scene-dashboard-head">
                  <div>
                    <p>Live market engine</p>
                    <h3>Yahoo quotes + news stream</h3>
                  </div>
                  <span className="badge badge-green">Streaming</span>
                </div>
                <div className="scene-dashboard-chart">
                  {Array.from({ length: 24 }).map((_, index) => (
                    <span
                      key={index}
                      style={{ height: `${42 + ((index * 13) % 56)}px` }}
                    />
                  ))}
                </div>
                <div className="scene-dashboard-meta">
                  {spotlightCards.map((stock) => {
                    const isPos = (stock.regularMarketChangePercent || 0) >= 0;
                    return (
                      <div
                        key={stock.symbol}
                        className="scene-float-card"
                        style={{ '--card-tilt': `${stock.angle}deg` }}
                      >
                        <div>
                          <strong>{stock.symbol?.replace('.NS', '')}</strong>
                          <small>{stock.shortName}</small>
                        </div>
                        <div className={isPos ? 'positive' : 'negative'}>
                          {isPos ? '+' : ''}{stock.regularMarketChangePercent?.toFixed(2)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section indices-section">
        <div className="container">
          <div className="section-header">
            <div>
              <div className="section-label">Market Overview</div>
              <h2 className="section-title">Indices at a glance</h2>
            </div>
            <div className="live-dot"><span className="dot-pulse" />Live via backend proxy</div>
          </div>
          <div className="indices-grid">
            {indicesLoading
              ? [1, 2, 3].map((item) => <div key={item} className="index-card skeleton" />)
              : indices.map((indexData, index) => (
                  <IndexCard key={indexData.symbol || index} data={indexData} delay={index * 0.08} />
                ))}
          </div>
        </div>
      </section>

      <section className="section insights-strip">
        <div className="container insights-grid">
          {[
            {
              icon: <Zap size={18} />,
              title: 'Smarter data pipeline',
              text: 'Yahoo Finance powers quotes and charts, while news can be enriched with a News API key through the backend.',
            },
            {
              icon: <Brain size={18} />,
              title: 'AI-ready workflows',
              text: 'Prediction, sentiment, anomaly, and risk pages stay accessible as product entry points from a single experience.',
            },
            {
              icon: <Globe size={18} />,
              title: 'Built for India',
              text: 'Symbols, rupee formatting, and benchmark context are shaped around the NSE and BSE ecosystem.',
            },
          ].map((item) => (
            <div key={item.title} className="insight-card">
              <div className="insight-icon">{item.icon}</div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section stocks-section">
        <div className="container">
          <div className="section-header">
            <div>
              <div className="section-label">Top Picks</div>
              <h2 className="section-title">Market leaders and movers</h2>
            </div>
            <div className="filter-tabs">
              {['all', 'gainers', 'losers'].map((tab) => (
                <button
                  key={tab}
                  className={`filter-tab ${filter === tab ? 'active' : ''}`}
                  onClick={() => setFilter(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {stocksLoading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="stocks-grid">
              {filteredStocks.slice(0, 12).map((stock) => (
                <StockCard key={stock.symbol} stock={stock} onBuy={setSelectedStock} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section features-section">
        <div className="container">
          <div className="section-label center">AI Powered</div>
          <h2 className="section-title center">Advanced analytics suite</h2>
          <p className="section-sub center">A cleaner product surface for signals, risk, and research workflows.</p>
          <div className="features-grid">
            {[
              { icon: <Brain size={28} />, title: 'Stock Prediction', desc: 'Forecast future moves with model-led scenarios and cleaner setup flows.', to: '/ai/prediction', color: 'green' },
              { icon: <BarChart2 size={28} />, title: 'Sentiment Analysis', desc: 'Pair headline flow with sentiment context and sector-aware interpretation.', to: '/ai/sentiment', color: 'blue' },
              { icon: <AlertTriangle size={28} />, title: 'Anomaly Detector', desc: 'Spot suspicious price and volume behaviour faster with event-first design.', to: '/ai/anomaly', color: 'orange' },
              { icon: <Shield size={28} />, title: 'Risk Analysis', desc: 'Review portfolio health, concentration, and downside pressure in one place.', to: '/ai/risk', color: 'purple' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <Link to={feature.to} className={`feature-card color-${feature.color}`}>
                  <div className="feat-icon">{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                  <span className="feat-link">Explore <ArrowRight size={13} /></span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section why-section">
        <div className="container">
          <div className="why-grid">
            <div className="why-content">
              <div className="section-label">Why stock.io</div>
              <h2 className="section-title">A better starting point for live market workflows</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 28 }}>
                The refreshed experience is organized around what traders actually need together:
                live prices, clean watchlists, portfolio tracking, better market context, and a news feed that can scale beyond placeholder headlines.
              </p>
              <div className="why-features">
                {[
                  { icon: <Zap size={16} />, text: 'Backend-backed quote and chart endpoints for the frontend' },
                  { icon: <Newspaper size={16} />, text: 'Dedicated news endpoint with News API enrichment and Yahoo fallback' },
                  { icon: <Lock size={16} />, text: 'Local portfolio state preserved for paper-trading style workflows' },
                  { icon: <Brain size={16} />, text: 'AI pages remain integrated into the main navigation and landing flow' },
                ].map((feature) => (
                  <div key={feature.text} className="why-feature">
                    <span className="why-icon">{feature.icon}</span>
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
              <Link to="/about" className="btn-secondary">Learn More <ArrowRight size={14} /></Link>
            </div>
            <div className="why-visual">
              <div className="why-card">
                <div className="why-card-header">
                  <span>Live market pulse</span>
                  <span className="badge badge-green">3D scene</span>
                </div>
                {spotlightCards.map((stock, index) => (
                  <div key={stock.symbol} className="why-row">
                    <span className="why-sym">{stock.symbol?.replace('.NS', '')}</span>
                    <div className="why-bar-wrap">
                      <div
                        className="why-bar"
                        style={{
                          width: `${Math.min(92, Math.abs(stock.regularMarketChangePercent || 0) * 28 + 30)}%`,
                          background: index % 2 === 0
                            ? 'var(--gradient-green)'
                            : 'linear-gradient(90deg, #7dd3fc, #22d3ee)',
                        }}
                      />
                    </div>
                    <span className={`why-pct ${(stock.regularMarketChangePercent || 0) >= 0 ? 'pos' : 'neg'}`}>
                      {(stock.regularMarketChangePercent || 0) >= 0 ? '+' : ''}{stock.regularMarketChangePercent?.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {!user && (
        <section className="section cta-section">
          <div className="container">
            <div className="cta-box">
              <div className="cta-orb" />
              <h2>Build your market workspace</h2>
              <p>Track Indian equities, follow live headlines, and experiment with AI-assisted workflows in one place.</p>
              <Link to="/auth?mode=signup" className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
                Create Free Account <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {selectedStock && (
        <BuySellModal stock={selectedStock} mode="buy" onClose={() => setSelectedStock(null)} />
      )}
    </div>
  );
};

export default Home;
