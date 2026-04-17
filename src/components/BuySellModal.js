// src/components/BuySellModal.js
import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, IndianRupee, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './BuySellModal.css';

const BuySellModal = ({ stock, mode: initialMode = 'buy', onClose }) => {
  const { balance, portfolio, buyStock, sellStock } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState(null);

  const price = stock?.regularMarketPrice || 0;
  const total = qty * price;
  const holding = portfolio.find(p => p.symbol === stock?.symbol);

  const handleSubmit = () => {
    if (qty < 1) return;
    const result = mode === 'buy'
      ? buyStock(stock.symbol, stock.shortName, parseInt(qty), price)
      : sellStock(stock.symbol, parseInt(qty), price);

    if (result.success) {
      setMessage({ type: 'success', text: `Successfully ${mode === 'buy' ? 'bought' : 'sold'} ${qty} share(s) of ${stock.symbol?.replace('.NS','')}` });
      setTimeout(onClose, 2000);
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  if (!stock) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-symbol">{stock.symbol?.replace('.NS', '')}</div>
            <div className="modal-name">{stock.shortName}</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-price">
          <span className="modal-price-label">LTP</span>
          <span className="modal-price-value">₹{price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          <span className={`modal-price-chg ${(stock.regularMarketChangePercent || 0) >= 0 ? 'pos' : 'neg'}`}>
            {(stock.regularMarketChangePercent || 0) >= 0 ? '+' : ''}{stock.regularMarketChangePercent?.toFixed(2)}%
          </span>
        </div>

        <div className="modal-tabs">
          <button className={`modal-tab buy ${mode === 'buy' ? 'active' : ''}`} onClick={() => setMode('buy')}>
            <TrendingUp size={14} /> Buy
          </button>
          <button className={`modal-tab sell ${mode === 'sell' ? 'active' : ''}`} onClick={() => setMode('sell')}>
            <TrendingDown size={14} /> Sell
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-info-row">
            <span><IndianRupee size={13} /> Available Balance</span>
            <span className="modal-info-val">₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          {holding && (
            <div className="modal-info-row">
              <span><Package size={13} /> Holdings</span>
              <span className="modal-info-val">{holding.qty} shares @ ₹{holding.avgPrice?.toFixed(2)}</span>
            </div>
          )}

          <div className="modal-input-group">
            <label>Quantity</label>
            <div className="qty-control">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <input
                type="number"
                className="input"
                value={qty}
                min="1"
                max={mode === 'sell' ? holding?.qty || 1 : 9999}
                onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <button onClick={() => setQty(qty + 1)}>+</button>
            </div>
          </div>

          <div className="modal-summary">
            <div className="modal-summary-row">
              <span>Price × Qty</span>
              <span>₹{price.toFixed(2)} × {qty}</span>
            </div>
            <div className="modal-summary-row total">
              <span>Total</span>
              <span>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {message && (
            <div className={`modal-message ${message.type}`}>{message.text}</div>
          )}

          <button
            className={`modal-submit ${mode}`}
            onClick={handleSubmit}
            disabled={mode === 'buy' ? total > balance : !holding || qty > (holding?.qty || 0)}
          >
            {mode === 'buy' ? `Buy ${qty} Share${qty > 1 ? 's' : ''}` : `Sell ${qty} Share${qty > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuySellModal;
