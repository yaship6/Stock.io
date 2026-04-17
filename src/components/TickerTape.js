// src/components/TickerTape.js
import React from 'react';
import { useIndices, useTopStocks } from '../hooks/useStockData';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './TickerTape.css';

const TickerTape = () => {
  const { indices } = useIndices();
  const { stocks } = useTopStocks();

  const items = [...indices, ...stocks.slice(0, 12)];

  const renderItem = (item, idx) => {
    const isPos = (item.regularMarketChangePercent || 0) >= 0;
    return (
      <span key={idx} className="ticker-item">
        <span className="ticker-name">{item.shortName?.split(' ')[0] || item.symbol?.replace('.NS','')}</span>
        <span className={`ticker-price ${isPos ? 'positive' : 'negative'}`}>
          ₹{item.regularMarketPrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </span>
        <span className={`ticker-change ${isPos ? 'positive' : 'negative'}`}>
          {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {isPos ? '+' : ''}{item.regularMarketChangePercent?.toFixed(2)}%
        </span>
        <span className="ticker-sep">•</span>
      </span>
    );
  };

  return (
    <div className="ticker-wrap">
      <div className="ticker-label">stock.io live</div>
      <div className="ticker-content">
        <div className="ticker-track">
          {items.map((item, i) => renderItem(item, i))}
          {items.map((item, i) => renderItem(item, `dup-${i}`))}
        </div>
      </div>
    </div>
  );
};

export default TickerTape;
