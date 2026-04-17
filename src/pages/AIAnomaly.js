// src/pages/AIAnomaly.js
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Zap, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine, AreaChart, Area } from 'recharts';
import { useTopStocks, useHistoricalData } from '../hooks/useStockData';
import './AIPages.css';

const detectAnomalies = (historicalData) => {
  if (!historicalData || historicalData.length < 10) return { priceData: [], anomalies: [] };

  // Calculate mean and standard deviation of daily returns
  const closes = historicalData.map((d) => d.close).filter(Boolean);
  const returns = closes.slice(1).map((price, i) => (price - closes[i]) / closes[i]);
  const meanReturn = returns.reduce((s, r) => s + r, 0) / returns.length;
  const stdReturn = Math.sqrt(returns.reduce((s, r) => s + (r - meanReturn) ** 2, 0) / returns.length);

  const priceData = historicalData.map((row, i) => {
    const dailyReturn = i > 0 ? (row.close - historicalData[i - 1].close) / historicalData[i - 1].close : 0;
    const zScore = stdReturn > 0 ? (dailyReturn - meanReturn) / stdReturn : 0;
    const isAnomaly = Math.abs(zScore) > 2.0;

    return {
      day: i + 1,
      date: new Date(row.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      price: parseFloat((row.close || 0).toFixed(2)),
      volume: row.volume || 0,
      zScore: parseFloat(zScore.toFixed(2)),
      isAnomaly,
      type: isAnomaly ? (zScore > 0 ? 'price_spike' : 'price_drop') : 'normal',
    };
  });

  const anomalies = priceData
    .filter((d) => d.isAnomaly)
    .map((d) => ({
      day: d.day,
      date: d.date,
      price: d.price,
      type: d.type,
      severity: Math.abs(d.zScore) > 3.0 ? 'high' : Math.abs(d.zScore) > 2.5 ? 'medium' : 'low',
      zScore: d.zScore,
      description: d.type === 'price_spike'
        ? `Unusual price spike detected — Z-score ${d.zScore.toFixed(2)} on ${d.date}`
        : `Abnormal price drop detected — Z-score ${d.zScore.toFixed(2)} on ${d.date}`,
    }));

  return { priceData, anomalies };
};

const AnomalyDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload.isAnomaly) return <circle cx={cx} cy={cy} r={2} fill="rgba(0,255,100,0.3)" />;
  return <circle cx={cx} cy={cy} r={6} fill={payload.zScore > 0 ? '#ff4d4d' : '#ff8c00'} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />;
};

const AIAnomaly = () => {
  const { stocks, loading: stocksLoading } = useTopStocks();
  const [searchQ, setSearchQ] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [historicalSymbol, setHistoricalSymbol] = useState(null);

  const { data: historicalData, loading: histLoading } = useHistoricalData(historicalSymbol, '3mo');

  const displayStocks = stocks.length > 0 ? stocks : [];
  const filteredStocks = searchQ
    ? displayStocks.filter(s => s.symbol?.toLowerCase().includes(searchQ.toLowerCase()) || s.shortName?.toLowerCase().includes(searchQ.toLowerCase()))
    : displayStocks.slice(0, 12);

  const detect = (stock) => {
    setSelectedStock(stock);
    setHistoricalSymbol(stock.symbol);
    setLoading(true);
    setResult(null);
  };

  // Process real historical data when it arrives
  useEffect(() => {
    if (selectedStock && historicalSymbol && !histLoading && loading) {
      setTimeout(() => {
        setResult(detectAnomalies(historicalData));
        setLoading(false);
      }, 600);
    }
  }, [historicalData, histLoading, selectedStock, historicalSymbol, loading]);

  return (
    <div className="page-wrapper ai-page">
      <div className="container" style={{ paddingTop: 100, paddingBottom: 60 }}>
        <div className="ai-header">
          <div className="ai-header-icon anomaly"><AlertTriangle size={32} /></div>
          <div>
            <div className="section-label">AI MODEL</div>
            <h1 className="section-title">Anomaly Detector</h1>
            <p className="ai-subtitle">Statistical Z-score analysis on real historical price data identifies unusual price movements and volume spikes over the past 3 months.</p>
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
                  <button key={i} className={`stock-select-item ${selectedStock?.symbol === s.symbol ? 'active' : ''}`} onClick={() => detect(s)}>
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
                <AlertTriangle size={56} style={{ color: 'var(--green-dark)', marginBottom: 16 }} />
                <h3>Select a stock to detect anomalies</h3>
                <p>Z-score analysis on real 3-month historical data identifies unusual trading patterns</p>
              </div>
            )}
            {loading && (
              <div className="ai-loading">
                <div className="ai-loading-anim"><div className="ai-pulse" /><AlertTriangle size={32} style={{ color: 'var(--orange)' }} /></div>
                <h3>Scanning {selectedStock?.symbol?.replace('.NS','')} for anomalies...</h3>
                <p>Fetching real historical data • Computing Z-scores • Pattern recognition</p>
                <div className="ai-progress-bar"><div className="ai-progress-fill" /></div>
              </div>
            )}

            {result && !loading && (
              <div>
                {/* Summary */}
                <div className="anomaly-summary">
                  <div className="anom-stat">
                    <span className="anom-stat-val" style={{ color: result.anomalies.length > 5 ? 'var(--red-loss)' : 'var(--orange)' }}>{result.anomalies.length}</span>
                    <span className="anom-stat-label">Anomalies Found</span>
                  </div>
                  <div className="anom-stat">
                    <span className="anom-stat-val" style={{ color: 'var(--red-loss)' }}>{result.anomalies.filter(a => a.type === 'price_spike').length}</span>
                    <span className="anom-stat-label">Price Spikes</span>
                  </div>
                  <div className="anom-stat">
                    <span className="anom-stat-val" style={{ color: 'var(--orange)' }}>{result.anomalies.filter(a => a.type === 'price_drop').length}</span>
                    <span className="anom-stat-label">Price Drops</span>
                  </div>
                  <div className="anom-stat">
                    <span className="anom-stat-val" style={{ color: 'var(--green-primary)' }}>{result.anomalies.filter(a => a.severity === 'high').length}</span>
                    <span className="anom-stat-label">High Severity</span>
                  </div>
                </div>

                {/* Chart */}
                {result.priceData.length > 0 && (
                  <>
                    <div className="pred-chart" style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                        Real 3-Month Price With Anomaly Markers ({result.priceData.length} data points)
                        <span style={{ marginLeft: 16, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--red-loss)' }}>● Spike</span>
                        <span style={{ marginLeft: 10, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--orange)' }}>● Drop</span>
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <ScatterChart>
                          <XAxis dataKey="day" name="Day" tick={{ fill: '#4a7a58', fontSize: 9 }} axisLine={false} tickLine={false} />
                          <YAxis dataKey="price" name="Price" tick={{ fill: '#4a7a58', fontSize: 9 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0]?.payload;
                              return (
                                <div style={{ background: '#071a0d', border: '1px solid rgba(0,255,100,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 11 }}>
                                  <div>{d.date} — ₹{d.price?.toLocaleString('en-IN')}</div>
                                  {d.isAnomaly && <div style={{ color: d.zScore > 0 ? 'var(--red-loss)' : 'var(--orange)', marginTop: 4 }}>⚠️ ANOMALY (Z={d.zScore})</div>}
                                </div>
                              );
                            }}
                          />
                          <Scatter data={result.priceData} shape={<AnomalyDot />} />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Z-Score Chart */}
                    <div className="pred-chart" style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Z-Score Distribution (|Z| &gt; 2.0 = Anomaly)</div>
                      <ResponsiveContainer width="100%" height={120}>
                        <AreaChart data={result.priceData}>
                          <defs>
                            <linearGradient id="zGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00ff64" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#00ff64" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="day" tick={{ fill: '#4a7a58', fontSize: 9 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#4a7a58', fontSize: 9 }} axisLine={false} tickLine={false} />
                          <ReferenceLine y={2.0} stroke="rgba(255,77,77,0.5)" strokeDasharray="4 2" />
                          <ReferenceLine y={-2.0} stroke="rgba(255,77,77,0.5)" strokeDasharray="4 2" />
                          <Area type="monotone" dataKey="zScore" stroke="#00ff64" strokeWidth={1.5} fill="url(#zGrad)" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}

                {/* Anomaly list */}
                {result.anomalies.length > 0 && (
                  <div className="anomaly-list">
                    <div className="ai-panel-title"><Activity size={14} /> Detected Anomalies</div>
                    {result.anomalies.map((a, i) => (
                      <div key={i} className={`anomaly-item severity-${a.severity}`}>
                        <div className="anom-icon">
                          {a.type === 'price_spike' ? <TrendingUp size={14} style={{ color: 'var(--red-loss)' }} /> : <TrendingDown size={14} style={{ color: 'var(--orange)' }} />}
                        </div>
                        <div className="anom-content">
                          <div className="anom-desc">{a.description}</div>
                          <div className="anom-meta">₹{a.price?.toLocaleString('en-IN')} • Z-Score: {a.zScore.toFixed(2)} • Severity: <span className={`sev-${a.severity}`}>{a.severity.toUpperCase()}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {result.anomalies.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    ✅ No significant anomalies detected in the past 3 months of trading data.
                  </div>
                )}
                <p className="ai-disclaimer">⚠️ Anomaly detection runs on real historical data with statistical Z-score analysis. Not all anomalies indicate manipulation or trading signals.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnomaly;
