// src/components/StockCard.js
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Star, StarOff, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './StockCard.css';

const StockCard = ({ stock, onBuy }) => {
  const { user, watchlist, addToWatchlist, removeFromWatchlist } = useAuth();
  const isPos = (stock.regularMarketChangePercent || 0) >= 0;
  const inWatchlist = watchlist.includes(stock.symbol);

  const handleWatchlist = (e) => {
    e.stopPropagation();
    if (!user) return;
    inWatchlist ? removeFromWatchlist(stock.symbol) : addToWatchlist(stock.symbol);
  };

  const formatPrice = (p) => p?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '—';
  const formatMarketCap = (mc) => {
    if (!mc) return '—';
    if (mc >= 1e12) return `₹${(mc / 1e12).toFixed(2)}T`;
    if (mc >= 1e9) return `₹${(mc / 1e9).toFixed(2)}B`;
    return `₹${(mc / 1e6).toFixed(0)}M`;
  };

  return (
    <div className={`stock-card ${isPos ? 'pos' : 'neg'}`}>
      <div className="sc-header">
        <div>
          <div className="sc-symbol">{stock.symbol?.replace('.NS', '').replace('.BO', '')}</div>
          <div className="sc-name">{stock.shortName || stock.longName || stock.symbol}</div>
        </div>
        <div className="sc-header-right">
          {user && (
            <button className="sc-watch-btn" onClick={handleWatchlist} title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}>
              {inWatchlist ? <Star size={14} fill="currentColor" style={{color:'var(--gold)'}} /> : <StarOff size={14} />}
            </button>
          )}
          <div className={`sc-badge ${isPos ? 'pos' : 'neg'}`}>
            {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {isPos ? '+' : ''}{stock.regularMarketChangePercent?.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="sc-price">
        ₹{formatPrice(stock.regularMarketPrice)}
      </div>

      <div className="sc-change" style={{color: isPos ? 'var(--green-primary)' : 'var(--red-loss)'}}>
        {isPos ? '+' : ''}₹{stock.regularMarketChange?.toFixed(2)} today
      </div>

      <div className="sc-stats">
        <div className="sc-stat">
          <span>Vol</span>
          <span>{stock.regularMarketVolume ? (stock.regularMarketVolume / 1e5).toFixed(1) + 'L' : '—'}</span>
        </div>
        <div className="sc-stat">
          <span>H</span>
          <span>₹{formatPrice(stock.regularMarketDayHigh)}</span>
        </div>
        <div className="sc-stat">
          <span>L</span>
          <span>₹{formatPrice(stock.regularMarketDayLow)}</span>
        </div>
      </div>

      {user && onBuy && (
        <button className="sc-buy-btn" onClick={() => onBuy(stock)}>
          <ShoppingCart size={13} /> Buy
        </button>
      )}
    </div>
  );
};

export default StockCard;
