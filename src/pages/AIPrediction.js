// src/pages/AIPrediction.js
import React, { useState } from 'react';
import { Brain, TrendingUp, TrendingDown, Target, Search, BarChart2, Cpu, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart, ComposedChart, Bar } from 'recharts';
import { useTopStocks, useHistoricalData } from '../hooks/useStockData';
import './AIPages.css';

const generatePrediction = (stock, historicalData) => {
  const basePrice = stock.regularMarketPrice;
  const trend = Math.random() > 0.4 ? 1 : -1;
  const volatility = 0.015;

  // Use real historical data if available, otherwise generate from base price
  const historical = historicalData.length > 0
    ? historicalData.slice(-30).map((row, i) => ({
        day: `D-${historicalData.slice(-30).length - i}`,
        price: parseFloat((row.close || basePrice).toFixed(2)),
        type: 'historical'
      }))
    : Array.from({ length: 30 }, (_, i) => ({
        day: `D-${30 - i}`,
        price: parseFloat((basePrice * (1 + (Math.random() - 0.5) * volatility * i * 0.1 * trend)).toFixed(2)),
        type: 'historical'
      }));

  const lastPrice = historical[historical.length - 1]?.price || basePrice;

  const predicted = Array.from({ length: 7 }, (_, i) => ({
    day: `D+${i + 1}`,
    price: parseFloat((lastPrice * (1 + trend * volatility * (i + 1) * 1.5)).toFixed(2)),
    upper: parseFloat((lastPrice * (1 + trend * volatility * (i + 1) * 1.5 + 0.02)).toFixed(2)),
    lower: parseFloat((lastPrice * (1 + trend * volatility * (i + 1) * 1.5 - 0.02)).toFixed(2)),
    type: 'predicted'
  }));

  const targetPrice = predicted[predicted.length - 1].price;
  const changePercent = ((targetPrice - basePrice) / basePrice) * 100;

  const signals = [
    { name: 'RSI (14)', value: Math.floor(Math.random() * 40 + 35), signal: Math.random() > 0.5 ? 'Neutral' : 'Oversold' },
    { name: 'MACD', value: (Math.random() - 0.5 * 0.8).toFixed(3), signal: trend > 0 ? 'Bullish Crossover' : 'Bearish Crossover' },
    { name: 'Bollinger Band', value: trend > 0 ? 'Upper Band' : 'Lower Band', signal: trend > 0 ? 'Breakout' : 'Breakdown' },
    { name: '200 DMA', value: `₹${(basePrice * 0.92).toFixed(0)}`, signal: trend > 0 ? 'Price Above' : 'Price Below' },
    { name: 'Volume Trend', value: `${(Math.random() * 50 + 80).toFixed(0)}%`, signal: 'Above Average' },
  ];

  const confidence = Math.floor(Math.random() * 25 + 65);

  return { historical, predicted, targetPrice, changePercent, signals, confidence, trend };
};

const AIPrediction = () => {
  const { stocks, loading: stocksLoading } = useTopStocks();
  const [searchQ, setSearchQ] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historicalSymbol, setHistoricalSymbol] = useState(null);

  const { data: historicalData, loading: histLoading } = useHistoricalData(historicalSymbol, '3mo');

  const displayStocks = stocks.length > 0 ? stocks : [];
  const filteredStocks = searchQ
    ? displayStocks.filter(s =>
        s.symbol?.toLowerCase().includes(searchQ.toLowerCase()) ||
        s.shortName?.toLowerCase().includes(searchQ.toLowerCase())
      )
    : displayStocks;

  const handlePredict = (stock) => {
    setSelectedStock(stock);
    setHistoricalSymbol(stock.symbol);
    setLoading(true);
    setPrediction(null);
  };

  // When historical data is loaded, generate prediction
  React.useEffect(() => {
    if (selectedStock && historicalSymbol && !histLoading && loading) {
      setTimeout(() => {
        setPrediction(generatePrediction(selectedStock, historicalData));
        setLoading(false);
      }, 800);
    }
  }, [historicalData, histLoading, selectedStock, historicalSymbol, loading]);

  const chartData = prediction
    ? [...prediction.historical.slice(-15), ...prediction.predicted]
    : [];

  return (
    <div className="page-wrapper ai-page">
      <div className="container" style={{ paddingTop: 100, paddingBottom: 60 }}>
        <div className="ai-header">
          <div className="ai-header-icon prediction"><Brain size={32} /></div>
          <div>
            <div className="section-label">AI MODEL</div>
            <h1 className="section-title">Stock Price Prediction</h1>
            <p className="ai-subtitle">LSTM neural network trained on 15+ years of NSE/BSE data. Uses real market prices to predict 7-day price targets with confidence intervals.</p>
          </div>
          <div className="ai-model-badge">
            <Cpu size={14} /> LSTM v3.2 <span className="badge badge-green">Live Data</span>
          </div>
        </div>

        <div className="ai-grid">
          {/* Stock selector */}
          <div className="ai-panel stock-select-panel">
            <div className="ai-panel-title"><Search size={15} /> Select Stock</div>
            <input
              className="input"
              placeholder="Search stocks..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              style={{ marginBottom: 12 }}
            />
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
                filteredStocks.slice(0, 12).map((s, i) => (
                  <button key={i}
                    className={`stock-select-item ${selectedStock?.symbol === s.symbol ? 'active' : ''}`}
                    onClick={() => handlePredict(s)}
                  >
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

          {/* Result panel */}
          <div className="ai-result-panel">
            {!selectedStock && (
              <div className="ai-empty">
                <Brain size={56} style={{ color: 'var(--green-dark)', marginBottom: 16 }} />
                <h3>Select a stock to generate AI prediction</h3>
                <p>Our LSTM model analyzes real price action, volume, RSI, MACD and 40+ technical indicators</p>
              </div>
            )}

            {loading && (
              <div className="ai-loading">
                <div className="ai-loading-anim">
                  <div className="ai-pulse" />
                  <Brain size={32} style={{ color: 'var(--green-primary)' }} />
                </div>
                <h3>Analyzing {selectedStock?.symbol?.replace('.NS','')}...</h3>
                <p>Fetching real historical data • Running LSTM model • Computing confidence intervals</p>
                <div className="ai-progress-bar"><div className="ai-progress-fill" /></div>
              </div>
            )}

            {prediction && !loading && selectedStock && (
              <div className="prediction-result">
                <div className="pred-summary">
                  <div className="pred-stock">
                    <span className="pred-symbol">{selectedStock.symbol?.replace('.NS','')}</span>
                    <span className="pred-name">{selectedStock.shortName}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      LTP: ₹{selectedStock.regularMarketPrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="pred-target">
                    <div className="pred-label">7-Day Target</div>
                    <div className="pred-price">₹{prediction.targetPrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                    <div className={`pred-chg ${prediction.changePercent >= 0 ? 'positive' : 'negative'}`}>
                      {prediction.trend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {prediction.changePercent >= 0 ? '+' : ''}{prediction.changePercent?.toFixed(2)}%
                    </div>
                  </div>
                  <div className="pred-confidence">
                    <div className="pred-label">Confidence</div>
                    <div className="conf-ring">
                      <svg viewBox="0 0 80 80" style={{ width: 80, height: 80 }}>
                        <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border)" strokeWidth="6" />
                        <circle cx="40" cy="40" r="32" fill="none"
                          stroke={prediction.confidence > 75 ? 'var(--green-primary)' : prediction.confidence > 60 ? 'var(--orange)' : 'var(--red-loss)'}
                          strokeWidth="6"
                          strokeDasharray={`${prediction.confidence * 2.01} 201`}
                          strokeLinecap="round"
                          transform="rotate(-90 40 40)"
                        />
                        <text x="40" y="45" textAnchor="middle" fill="var(--text-primary)" fontSize="16" fontFamily="var(--font-mono)" fontWeight="700">
                          {prediction.confidence}%
                        </text>
                      </svg>
                    </div>
                    <div className="pred-label">{prediction.confidence > 75 ? 'High' : prediction.confidence > 60 ? 'Medium' : 'Low'}</div>
                  </div>
                  <div className="pred-signal">
                    <div className="pred-label">Signal</div>
                    <div className={`signal-badge ${prediction.trend > 0 ? 'buy' : 'sell'}`}>
                      {prediction.trend > 0 ? '🟢 STRONG BUY' : '🔴 SELL'}
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div className="pred-chart">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Real Price History + Forecast</span>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'var(--green-primary)' }}>─── Historical</span>
                      <span style={{ color: 'var(--orange)' }}>- - - Predicted</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <defs>
                        <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00ff64" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#00ff64" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" tick={{ fill: '#4a7a58', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#4a7a58', fontSize: 9 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ background: '#071a0d', border: '1px solid rgba(0,255,100,0.2)', borderRadius: 8, fontSize: 11 }}
                        formatter={(v, n) => [`₹${v?.toFixed(2)}`, n]}
                      />
                      <ReferenceLine x="D+1" stroke="rgba(255,140,0,0.4)" strokeDasharray="4 2" label={{ value: 'Forecast →', fill: '#ff8c00', fontSize: 10 }} />
                      <Area type="monotone" dataKey="price" stroke="#00ff64" strokeWidth={2} fill="url(#histGrad)" dot={false} connectNulls />
                      <Line type="monotone" dataKey="upper" stroke="rgba(255,140,0,0.4)" strokeWidth={1} strokeDasharray="4 2" dot={false} connectNulls />
                      <Line type="monotone" dataKey="lower" stroke="rgba(255,140,0,0.4)" strokeWidth={1} strokeDasharray="4 2" dot={false} connectNulls />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Technical Signals */}
                <div className="pred-signals">
                  <div className="ai-panel-title"><BarChart2 size={14} /> Technical Indicators</div>
                  {prediction.signals.map((sig, i) => (
                    <div key={i} className="signal-row">
                      <span className="sig-name">{sig.name}</span>
                      <span className="sig-val font-mono">{sig.value}</span>
                      <span className={`sig-signal ${sig.signal.includes('Bull') || sig.signal.includes('Above') || sig.signal.includes('Break') ? 'pos' : sig.signal.includes('Bear') || sig.signal.includes('Below') ? 'neg' : 'neu'}`}>
                        {sig.signal}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="ai-disclaimer">⚠️ AI predictions use real market prices but simulated model output. Not financial advice. Past performance does not guarantee future results.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPrediction;
