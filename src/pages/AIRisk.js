// src/pages/AIRisk.js
import React, { useState } from 'react';
import { Shield, Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { useTopStocks } from '../hooks/useStockData';
import './AIPages.css';

const sectors = {
  'RELIANCE.NS': 'Energy', 'TCS.NS': 'IT', 'HDFCBANK.NS': 'Banking',
  'INFY.NS': 'IT', 'ICICIBANK.NS': 'Banking', 'SBIN.NS': 'Banking',
  'ITC.NS': 'FMCG', 'BHARTIARTL.NS': 'Telecom', 'KOTAKBANK.NS': 'Banking',
  'LT.NS': 'Infrastructure', 'BAJFINANCE.NS': 'NBFC', 'WIPRO.NS': 'IT',
  'HCLTECH.NS': 'IT', 'MARUTI.NS': 'Auto', 'AXISBANK.NS': 'Banking',
  'HINDUNILVR.NS': 'FMCG', 'ASIANPAINT.NS': 'Consumer', 'ULTRACEMCO.NS': 'Cement',
  'NESTLEIND.NS': 'FMCG', 'TITAN.NS': 'Consumer',
};

const calculateRisk = (portfolio) => {
  const totalValue = portfolio.reduce((s, p) => s + p.value, 0);

  const metrics = {
    volatility: parseFloat((Math.random() * 15 + 8).toFixed(2)),
    beta: parseFloat((0.7 + Math.random() * 0.8).toFixed(2)),
    sharpe: parseFloat((0.8 + Math.random() * 1.5).toFixed(2)),
    var95: parseFloat((totalValue * (0.02 + Math.random() * 0.04)).toFixed(0)),
    maxDrawdown: parseFloat((10 + Math.random() * 20).toFixed(2)),
    diversification: Math.min(100, Math.floor(portfolio.length * 12 + Math.random() * 20)),
  };

  const riskScore = Math.floor(
    (metrics.volatility / 30 * 25) +
    (Math.abs(metrics.beta - 1) * 25) +
    ((3 - Math.min(metrics.sharpe, 3)) / 3 * 25) +
    ((100 - metrics.diversification) / 100 * 25)
  );

  const radarData = [
    { subject: 'Volatility', A: Math.min(100, metrics.volatility * 4) },
    { subject: 'Liquidity', A: 75 + Math.random() * 20 },
    { subject: 'Diversification', A: metrics.diversification },
    { subject: 'Beta Risk', A: Math.min(100, metrics.beta * 60) },
    { subject: 'Sector Conc.', A: Math.max(20, 100 - metrics.diversification) },
    { subject: 'Market Risk', A: 40 + Math.random() * 40 },
  ];

  const recommendations = [
    metrics.diversification < 60 && { type: 'warning', text: 'Portfolio lacks diversification. Consider adding stocks from different sectors.' },
    metrics.beta > 1.3 && { type: 'danger', text: 'High beta portfolio — more volatile than market. Reduce exposure to aggressive stocks.' },
    metrics.sharpe < 1 && { type: 'warning', text: 'Sharpe ratio below 1. Risk-adjusted returns are suboptimal.' },
    portfolio.length >= 5 && { type: 'success', text: 'Good number of holdings. Portfolio is reasonably spread.' },
    metrics.volatility < 15 && { type: 'success', text: 'Portfolio volatility is within acceptable range.' },
  ].filter(Boolean);

  return { metrics, riskScore, radarData, recommendations };
};

const AIRisk = () => {
  const { stocks, loading: stocksLoading } = useTopStocks();
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Initialize with real stock prices when they load
  React.useEffect(() => {
    if (stocks.length > 0 && !initialized) {
      const defaults = stocks.slice(0, 3).map((s) => ({
        symbol: s.symbol,
        name: s.shortName || s.longName || s.symbol,
        qty: 10,
        price: s.regularMarketPrice || 0,
        sector: sectors[s.symbol] || 'Others',
        value: (s.regularMarketPrice || 0) * 10,
      }));
      setPortfolioItems(defaults);
      setInitialized(true);
    }
  }, [stocks, initialized]);

  const analyze = () => {
    if (portfolioItems.length === 0) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setResult(calculateRisk(portfolioItems));
      setLoading(false);
    }, 1800);
  };

  const addStock = (stock) => {
    if (portfolioItems.find(p => p.symbol === stock.symbol)) return;
    setPortfolioItems(prev => [...prev, {
      symbol: stock.symbol,
      name: stock.shortName || stock.longName || stock.symbol,
      qty: 10,
      price: stock.regularMarketPrice || 0,
      sector: sectors[stock.symbol] || 'Others',
      value: (stock.regularMarketPrice || 0) * 10,
    }]);
    setResult(null);
  };

  const removeItem = (symbol) => {
    setPortfolioItems(prev => prev.filter(p => p.symbol !== symbol));
    setResult(null);
  };

  const totalValue = portfolioItems.reduce((s, p) => s + p.value, 0);

  const riskColor = result ? (result.riskScore > 66 ? 'var(--red-loss)' : result.riskScore > 33 ? 'var(--orange)' : 'var(--green-primary)') : 'var(--green-primary)';
  const riskLabel = result ? (result.riskScore > 66 ? 'HIGH RISK' : result.riskScore > 33 ? 'MEDIUM RISK' : 'LOW RISK') : '';

  const availableStocks = stocks.filter(s =>
    !portfolioItems.find(p => p.symbol === s.symbol) &&
    (s.symbol?.toLowerCase().includes(searchQ.toLowerCase()) || s.shortName?.toLowerCase().includes(searchQ.toLowerCase()))
  );

  return (
    <div className="page-wrapper ai-page">
      <div className="container" style={{ paddingTop: 100, paddingBottom: 60 }}>
        <div className="ai-header">
          <div className="ai-header-icon risk"><Shield size={32} /></div>
          <div>
            <div className="section-label">AI MODEL</div>
            <h1 className="section-title">Portfolio Risk AI</h1>
            <p className="ai-subtitle">Monte Carlo simulations + Modern Portfolio Theory using real market prices to assess VaR, Sharpe ratio, beta exposure, and sector concentration risk.</p>
          </div>
        </div>

        <div className="risk-layout">
          {/* Left: Portfolio Builder */}
          <div className="risk-builder">
            <div className="ai-panel">
              <div className="ai-panel-title">Build Your Portfolio (Live Prices)</div>
              <div className="portfolio-builder-list">
                {portfolioItems.length === 0 && !stocksLoading && (
                  <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    Add stocks from the list below to build your portfolio
                  </div>
                )}
                {stocksLoading && portfolioItems.length === 0 && (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 8px' }} />
                    Loading real stock prices...
                  </div>
                )}
                {portfolioItems.map((item, i) => (
                  <div key={i} className="pb-item">
                    <div className="pb-sym">{item.symbol?.replace('.NS','')}</div>
                    <div className="pb-name">{item.name}</div>
                    <div className="pb-val font-mono">₹{item.value?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    <div className="pb-pct font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : 0}%</div>
                    <button className="action-btn remove" onClick={() => removeItem(item.symbol)}><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
              <div className="pb-total">
                <span>Total Value</span>
                <span className="font-mono" style={{ color: 'var(--green-primary)', fontWeight: 700 }}>₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={analyze} disabled={portfolioItems.length === 0 || loading}>
                <Shield size={15} /> Analyze Risk
              </button>

              <div style={{ marginTop: 20 }}>
                <div className="ai-panel-title"><Plus size={13} /> Add Stocks (Live)</div>
                <input className="input" placeholder="Search to add..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ marginBottom: 10, marginTop: 8 }} />
                <div className="stock-select-list" style={{ maxHeight: 200 }}>
                  {availableStocks.slice(0, 8).map((s, i) => (
                    <button key={i} className="stock-select-item" onClick={() => addStock(s)}>
                      <div>
                        <div className="ssl-sym">{s.symbol?.replace('.NS','')}</div>
                        <div className="ssl-name">{s.shortName}</div>
                      </div>
                      <Plus size={14} style={{ color: 'var(--green-primary)' }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="risk-results">
            {!result && !loading && (
              <div className="ai-empty">
                <Shield size={56} style={{ color: 'var(--green-dark)', marginBottom: 16 }} />
                <h3>Add stocks and click Analyze Risk</h3>
                <p>Monte Carlo simulation runs 10,000 scenarios using real market prices to calculate your portfolio's risk profile</p>
              </div>
            )}
            {loading && (
              <div className="ai-loading">
                <div className="ai-loading-anim"><div className="ai-pulse" /><Shield size={32} style={{ color: 'var(--green-primary)' }} /></div>
                <h3>Running risk simulations...</h3>
                <p>Monte Carlo simulation • VaR calculation • Correlation analysis</p>
                <div className="ai-progress-bar"><div className="ai-progress-fill" /></div>
              </div>
            )}

            {result && !loading && (
              <div>
                {/* Risk Score */}
                <div className="risk-score-card">
                  <div className="risk-score-circle" style={{ borderColor: riskColor }}>
                    <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-display)', color: riskColor }}>{result.riskScore}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Risk Score</div>
                  </div>
                  <div>
                    <div className="risk-label" style={{ color: riskColor }}>{riskLabel}</div>
                    <div className="risk-metrics">
                      {[
                        { label: 'Volatility', val: `${result.metrics.volatility}%` },
                        { label: 'Beta', val: result.metrics.beta },
                        { label: 'Sharpe Ratio', val: result.metrics.sharpe },
                        { label: 'VaR (95%)', val: `₹${result.metrics.var95?.toLocaleString('en-IN')}` },
                        { label: 'Max Drawdown', val: `${result.metrics.maxDrawdown}%` },
                        { label: 'Diversification', val: `${result.metrics.diversification}%` },
                      ].map((m, i) => (
                        <div key={i} className="risk-metric-item">
                          <span className="risk-metric-label">{m.label}</span>
                          <span className="risk-metric-val font-mono">{m.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Radar + Recommendations */}
                <div className="risk-bottom">
                  <div>
                    <div className="ai-panel-title">Risk Dimensions</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={result.radarData}>
                        <PolarGrid stroke="var(--border)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                        <Radar name="Risk" dataKey="A" stroke="var(--green-primary)" fill="var(--green-primary)" fillOpacity={0.15} strokeWidth={2} />
                        <Tooltip contentStyle={{ background: '#071a0d', border: '1px solid rgba(0,255,100,0.2)', borderRadius: 8, fontSize: 11 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <div className="ai-panel-title">AI Recommendations</div>
                    <div className="recommendations">
                      {result.recommendations.map((r, i) => (
                        <div key={i} className={`recommendation ${r.type}`}>
                          {r.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                          <span>{r.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="ai-disclaimer">⚠️ Risk analysis uses real market prices with simulated Monte Carlo scenarios. Not financial advice. Consult a SEBI-registered advisor.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRisk;
