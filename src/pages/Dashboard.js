import React, { useMemo, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  useStockQuote,
  useTopStocks,
  useChartData,
  useStockSearch,
  useMarketSummary,
} from '../hooks/useStockData';
import BuySellModal from '../components/BuySellModal';
import StockCard from '../components/StockCard';
import {
  TrendingUp,
  IndianRupee,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Search,
  Trash2,
  Clock,
  Activity,
  Sparkles,
  Newspaper,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import './Dashboard.css';

const PortfolioChart = ({ portfolio, quotes }) => {
  const data = portfolio.map((position) => {
    const quote = quotes.find((item) => item.symbol === position.symbol);
    const currentPrice = quote?.regularMarketPrice || position.avgPrice;
    const pnl = (currentPrice - position.avgPrice) * position.qty;
    return {
      name: position.symbol.replace('.NS', ''),
      pnl: parseFloat(pnl.toFixed(2)),
      value: parseFloat((currentPrice * position.qty).toFixed(2)),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={190}>
      <AreaChart data={data} margin={{ top: 8, right: 5, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00ff88" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" tick={{ fill: '#6d9580', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#6d9580', fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
        <Tooltip
          contentStyle={{ background: '#071a0d', border: '1px solid rgba(0,255,136,0.18)', borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: '#e8fff2' }}
          itemStyle={{ color: '#00ff88' }}
          formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'P&L']}
        />
        <Area type="monotone" dataKey="pnl" stroke="#00ff88" strokeWidth={2} fill="url(#portfolioGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const PriceChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={210}>
    <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
      <defs>
        <linearGradient id="spotline" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#00ff88" />
        </linearGradient>
      </defs>
      <XAxis dataKey="time" tick={{ fill: '#6d9580', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={28} />
      <YAxis domain={['auto', 'auto']} tick={{ fill: '#6d9580', fontSize: 10 }} axisLine={false} tickLine={false} width={54} />
      <Tooltip
        contentStyle={{ background: '#071a0d', border: '1px solid rgba(0,255,136,0.18)', borderRadius: 12, fontSize: 12 }}
        formatter={(value) => [`₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, 'Price']}
      />
      <Line type="monotone" dataKey="price" stroke="url(#spotline)" strokeWidth={2.5} dot={false} />
    </LineChart>
  </ResponsiveContainer>
);

const chartRanges = [
  { key: '1d', label: '1D', interval: '5m' },
  { key: '5d', label: '5D', interval: '30m' },
  { key: '1mo', label: '1M', interval: '1d' },
  { key: '3mo', label: '3M', interval: '1d' },
  { key: '1y', label: '1Y', interval: '1d' },
];

const Dashboard = () => {
  const { user, portfolio, watchlist, transactions, balance, removeFromWatchlist } = useAuth();
  const { stocks, loading: stocksLoading, error: stocksError, refetch: refetchStocks } = useTopStocks();
  const { summary, error: summaryError } = useMarketSummary();
  const [modal, setModal] = useState(null);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [searchQ, setSearchQ] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE.NS');
  const [chartRange, setChartRange] = useState('1d');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const portfolioSymbols = portfolio.map((position) => position.symbol);
  const { quotes: portfolioQuotes } = useStockQuote(portfolioSymbols);
  const { quotes: watchlistQuotes } = useStockQuote(watchlist);
  const { chartData, loading: chartLoading, error: chartError } = useChartData(selectedSymbol, chartRange);
  const { results: searchResults, loading: searchLoading } = useStockSearch(searchQ);

  // Update last-refreshed timestamp
  useEffect(() => {
    const timer = setInterval(() => setLastRefreshed(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  if (!user) {
    return <Navigate to="/auth" />;
  }

  const totalInvested = portfolio.reduce((sum, position) => sum + position.avgPrice * position.qty, 0);
  const totalCurrent = portfolio.reduce((sum, position) => {
    const quote = portfolioQuotes.find((item) => item.symbol === position.symbol);
    return sum + (quote?.regularMarketPrice || position.avgPrice) * position.qty;
  }, 0);
  const totalPnL = totalCurrent - totalInvested;
  const pnlPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  const selectedStock =
    stocks.find((stock) => stock.symbol === selectedSymbol) ||
    portfolioQuotes.find((stock) => stock.symbol === selectedSymbol) ||
    watchlistQuotes.find((stock) => stock.symbol === selectedSymbol);

  const browseStocks = searchQ.trim() ? searchResults : stocks.slice(0, 8);
  const watchlistCards = watchlist
    .map((symbol) => watchlistQuotes.find((quote) => quote.symbol === symbol))
    .filter(Boolean);

  const newsPrompt = useMemo(() => {
    const topGainer = summary?.leaders?.topGainer?.symbol?.replace('.NS', '') || 'market leaders';
    const breadth = summary?.breadth;
    return `Advancers ${breadth?.advancing || 0} vs decliners ${breadth?.declining || 0}. ${topGainer} is leading momentum.`;
  }, [summary]);

  const tabs = [
    { key: 'portfolio', label: 'Portfolio', icon: <Package size={14} /> },
    { key: 'watchlist', label: 'Watchlist', icon: <Star size={14} /> },
    { key: 'transactions', label: 'History', icon: <Clock size={14} /> },
  ];

  return (
    <div className="page-wrapper dashboard-page">
      <div className="container dashboard-shell">
        <div className="dash-header">
          <div>
            <div className="section-label">Dashboard</div>
            <h1 className="dash-title">Welcome back, <span className="text-green">{user.name.split(' ')[0]}</span></h1>
            <p className="dash-subtitle">
              Track holdings, browse live ideas, inspect charts, and jump from price action to news context quickly.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexDirection: 'column' }}>
            <div className="dash-balance-card">
              <span className="dash-balance-label"><IndianRupee size={13} /> Virtual Balance</span>
              <span className="dash-balance-val">₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <span className="dot-pulse" style={{ width: 6, height: 6 }} />
              Live • Updated {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              <button onClick={refetchStocks} style={{ background: 'none', border: 'none', color: 'var(--green-primary)', cursor: 'pointer', padding: 2 }}>
                <RefreshCw size={12} />
              </button>
            </div>
          </div>
        </div>

        <div className="dash-metrics">
          {[
            { label: 'Total Invested', value: `₹${totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: <Package size={18} /> },
            { label: 'Current Value', value: `₹${totalCurrent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: <TrendingUp size={18} /> },
            { label: 'Total P&L', value: `${totalPnL >= 0 ? '+' : ''}₹${totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: totalPnL >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />, color: totalPnL >= 0 ? 'green' : 'red' },
            { label: 'P&L %', value: `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`, icon: <Activity size={18} />, color: pnlPct >= 0 ? 'green' : 'red' },
          ].map((metric) => (
            <div key={metric.label} className={`dash-metric ${metric.color || ''}`}>
              <div className="dash-metric-icon">{metric.icon}</div>
              <div>
                <div className="dash-metric-label">{metric.label}</div>
                <div className="dash-metric-val">{metric.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-top-grid">
          <div className="dash-panel spotlight-panel">
            <div className="dash-panel-head">
              <div>
                <div className="section-label">Market Spotlight</div>
                <h2 className="dash-panel-title">{selectedStock?.shortName || selectedSymbol.replace('.NS', '')}</h2>
              </div>
              <div className="spotlight-actions">
                {(watchlistCards.slice(0, 3).length ? watchlistCards : stocks.slice(0, 3)).map((stock) => (
                  <button
                    key={stock.symbol}
                    className={`spotlight-chip ${selectedSymbol === stock.symbol ? 'active' : ''}`}
                    onClick={() => setSelectedSymbol(stock.symbol)}
                  >
                    {stock.symbol.replace('.NS', '')}
                  </button>
                ))}
              </div>
            </div>

            {selectedStock && (
              <div className="spotlight-summary">
                <div>
                  <strong>₹{selectedStock.regularMarketPrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                  <span className={(selectedStock.regularMarketChangePercent || 0) >= 0 ? 'positive' : 'negative'}>
                    {(selectedStock.regularMarketChangePercent || 0) >= 0 ? '+' : ''}{selectedStock.regularMarketChange?.toFixed(2)} today
                  </span>
                </div>
                <div className="spotlight-meta">
                  <span>High: ₹{selectedStock.regularMarketDayHigh?.toFixed(2) || '—'}</span>
                  <span>Low: ₹{selectedStock.regularMarketDayLow?.toFixed(2) || '—'}</span>
                  <span>Vol: {selectedStock.regularMarketVolume?.toLocaleString('en-IN') || '—'}</span>
                </div>
              </div>
            )}

            {/* Chart Range Selector */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {chartRanges.map((r) => (
                <button
                  key={r.key}
                  className={`spotlight-chip ${chartRange === r.key ? 'active' : ''}`}
                  onClick={() => setChartRange(r.key)}
                  style={{ fontSize: 11, padding: '4px 12px' }}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {chartLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 210, color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ width: 24, height: 24 }} />
              </div>
            ) : chartError ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 210, color: 'var(--text-muted)', fontSize: 13, gap: 8 }}>
                <AlertCircle size={16} /> Unable to load chart data
              </div>
            ) : (
              <PriceChart data={chartData} />
            )}
          </div>

          <div className="dash-panel insights-panel">
            <div className="dash-panel-head compact">
              <div>
                <div className="section-label">Quick Context</div>
                <h2 className="dash-panel-title">Today’s read</h2>
              </div>
              <span className="badge badge-green">Live</span>
            </div>

            <div className="insight-stack">
              <div className="mini-insight-card">
                <Sparkles size={17} />
                <div>
                  <strong>Market breadth</strong>
                  <p>{newsPrompt}</p>
                </div>
              </div>
              <div className="mini-insight-card">
                <Newspaper size={17} />
                <div>
                  <strong>Next best step</strong>
                  <p>Use the News page to drill into the same symbol or sector and compare headlines against your watchlist.</p>
                </div>
              </div>
            </div>

            <div className="watchlist-mini">
              <div className="watchlist-mini-head">
                <span>Watchlist Movers</span>
                <span>{watchlistCards.length}</span>
              </div>
              {watchlistCards.length === 0 ? (
                <div className="empty-inline">Add stocks to your watchlist from the market browser below.</div>
              ) : (
                watchlistCards.slice(0, 4).map((stock) => (
                  <button
                    key={stock.symbol}
                    className="watchlist-mini-row"
                    onClick={() => setSelectedSymbol(stock.symbol)}
                  >
                    <div>
                      <strong>{stock.symbol.replace('.NS', '')}</strong>
                      <span>{stock.shortName}</span>
                    </div>
                    <div className={(stock.regularMarketChangePercent || 0) >= 0 ? 'positive' : 'negative'}>
                      {(stock.regularMarketChangePercent || 0) >= 0 ? '+' : ''}{stock.regularMarketChangePercent?.toFixed(2)}%
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="dash-grid">
          <div className="dash-panel">
            <div className="dash-tabs">
              {tabs.map((tab) => (
                <button key={tab.key} className={`dash-tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                  {tab.icon}{tab.label}
                  {tab.key === 'portfolio' && <span className="tab-count">{portfolio.length}</span>}
                  {tab.key === 'watchlist' && <span className="tab-count">{watchlist.length}</span>}
                </button>
              ))}
            </div>

            {activeTab === 'portfolio' && (
              <div className="tab-content">
                {portfolio.length === 0 ? (
                  <div className="empty-state">
                    <Package size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                    <p>No holdings yet. Buy your first stock from the market browser.</p>
                  </div>
                ) : (
                  <>
                    <PortfolioChart portfolio={portfolio} quotes={portfolioQuotes} />
                    <div className="holdings-list">
                      <div className="holdings-head">
                        <span>Stock</span><span>Qty</span><span>Avg</span><span>LTP</span><span>P&L</span><span>Actions</span>
                      </div>
                      {portfolio.map((holding) => {
                        const quote = portfolioQuotes.find((item) => item.symbol === holding.symbol);
                        const ltp = quote?.regularMarketPrice || holding.avgPrice;
                        const pnl = (ltp - holding.avgPrice) * holding.qty;
                        const rowPnlPct = ((ltp - holding.avgPrice) / holding.avgPrice) * 100;
                        const rowStock = quote || {
                          symbol: holding.symbol,
                          shortName: holding.name,
                          regularMarketPrice: ltp,
                        };

                        return (
                          <div key={holding.symbol} className="holding-row">
                            <div>
                              <div className="holding-sym">{holding.symbol.replace('.NS', '')}</div>
                              <div className="holding-name">{holding.name}</div>
                            </div>
                            <span className="font-mono">{holding.qty}</span>
                            <span className="font-mono">₹{holding.avgPrice?.toFixed(2)}</span>
                            <span className="font-mono">₹{ltp.toFixed(2)}</span>
                            <div>
                              <div className={`font-mono ${pnl >= 0 ? 'positive' : 'negative'}`}>
                                {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(0)}
                              </div>
                              <div className={`font-mono ${rowPnlPct >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: 11 }}>
                                {rowPnlPct >= 0 ? '+' : ''}{rowPnlPct.toFixed(2)}%
                              </div>
                            </div>
                            <div className="holding-actions">
                              <button className="action-btn buy" onClick={() => setModal({ stock: rowStock, mode: 'buy' })}>Buy</button>
                              <button className="action-btn sell" onClick={() => setModal({ stock: rowStock, mode: 'sell' })}>Sell</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'watchlist' && (
              <div className="tab-content">
                {watchlist.length === 0 ? (
                  <div className="empty-state">
                    <Star size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                    <p>No stocks in watchlist yet. Star a stock from the market browser to track it.</p>
                  </div>
                ) : (
                  <div className="watchlist-list">
                    {watchlist.map((symbol) => {
                      const quote = watchlistQuotes.find((item) => item.symbol === symbol);
                      const isPos = (quote?.regularMarketChangePercent || 0) >= 0;
                      return (
                        <div key={symbol} className="watchlist-row">
                          <button className="watchlist-link" onClick={() => setSelectedSymbol(symbol)}>
                            <div className="holding-sym">{symbol.replace('.NS', '')}</div>
                            <div className="holding-name">{quote?.shortName || symbol}</div>
                          </button>
                          <div style={{ textAlign: 'right' }}>
                            <div className="font-mono" style={{ fontSize: 15, fontWeight: 700 }}>
                              ₹{quote?.regularMarketPrice?.toFixed(2) || '—'}
                            </div>
                            <div className={`font-mono ${isPos ? 'positive' : 'negative'}`} style={{ fontSize: 12 }}>
                              {isPos ? '+' : ''}{quote?.regularMarketChangePercent?.toFixed(2) || '0'}%
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="action-btn buy" onClick={() => quote && setModal({ stock: quote, mode: 'buy' })}>Buy</button>
                            <button className="action-btn remove" onClick={() => removeFromWatchlist(symbol)}><Trash2 size={13} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="tab-content">
                {transactions.length === 0 ? (
                  <div className="empty-state">
                    <Clock size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                    <p>No transactions yet.</p>
                  </div>
                ) : (
                  <div className="txn-list">
                    {transactions.slice(0, 20).map((txn) => (
                      <div key={txn.id} className="txn-row">
                        <div className={`txn-type ${txn.type === 'BUY' ? 'buy' : 'sell'}`}>{txn.type}</div>
                        <div>
                          <div className="holding-sym">{txn.symbol?.replace('.NS', '')}</div>
                          <div className="holding-name">
                            {new Date(txn.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="font-mono" style={{ fontSize: 13 }}>{txn.qty} × ₹{txn.price?.toFixed(2)}</div>
                          <div className={`font-mono ${txn.type === 'BUY' ? 'negative' : 'positive'}`} style={{ fontSize: 13, fontWeight: 700 }}>
                            {txn.type === 'BUY' ? '-' : '+'}₹{txn.total?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="dash-panel dash-right">
            <div className="market-search-box">
              <div className="section-label">Browse Market</div>
              <div className="input-wrap" style={{ marginBottom: 16 }}>
                <Search size={15} className="input-icon" />
                <input
                  className="input input-with-icon"
                  placeholder="Search NSE or BSE symbols..."
                  value={searchQ}
                  onChange={(event) => setSearchQ(event.target.value)}
                />
              </div>
              <div className="market-search-meta">
                <span>{searchQ.trim() ? 'Search results' : 'Top tracked names'}</span>
                <span>{searchLoading ? 'Searching…' : `${browseStocks.length} items`}</span>
              </div>
              <div className="market-cards">
                {browseStocks.map((stock) => (
                  <div key={stock.symbol} className="market-card-wrap">
                    <button className="market-pin" onClick={() => setSelectedSymbol(stock.symbol)}>
                      View chart
                    </button>
                    <StockCard stock={stock} onBuy={(current) => setModal({ stock: current, mode: 'buy' })} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <BuySellModal
          stock={modal.stock}
          mode={modal.mode}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
