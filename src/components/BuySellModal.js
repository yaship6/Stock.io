// src/components/BuySellModal.js
import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Package,
  Smartphone,
  CreditCard,
  Wallet,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './BuySellModal.css';

const POPULAR_HANDLES = ['@okhdfcbank', '@okicici', '@oksbi', '@ybl', '@paytm'];

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const BuySellModal = ({ stock, mode: initialMode = 'buy', onClose }) => {
  const { user, balance, portfolio, buyStock, sellStock } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Buy payment source: 'WALLET' | 'UPI' | 'RAZORPAY'
  const [paymentSource, setPaymentSource] = useState('WALLET');
  const [upiId, setUpiId] = useState('');

  // Sell payout destination: 'WALLET' | 'UPI'
  const [payoutDest, setPayoutDest] = useState('WALLET');
  const [sellUpiId, setSellUpiId] = useState('');

  // Gateway config
  const [gatewayConfig, setGatewayConfig] = useState({ configured: false, keyId: null });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/payment/config');
        const data = await res.json();
        setGatewayConfig({
          configured: Boolean(data.configured),
          keyId: data.keyId || null,
        });
      } catch (err) {
        console.warn('Could not fetch payment config:', err);
      }
    };
    fetchConfig();
  }, []);

  const price = stock?.regularMarketPrice || 0;
  const total = qty * price;
  const holding = portfolio.find((p) => p.symbol === stock?.symbol);
  const isBalanceShortfall = mode === 'buy' && paymentSource === 'WALLET' && total > balance;

  const handleHandleAppend = (suffix) => {
    const prefix = upiId.includes('@') ? upiId.split('@')[0] : upiId;
    setUpiId(`${prefix}${suffix}`);
  };

  // BUY via UPI
  const handleBuyWithUpi = async () => {
    if (!upiId || !upiId.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid UPI ID (e.g., yourname@okhdfcbank)' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/payment/upi-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          upiId: upiId.trim(),
          upiApp: 'Direct Stock Buy',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'UPI payment failed.');
      }

      // Execute buy without deducting from trading balance
      const result = buyStock(stock.symbol, stock.shortName, parseInt(qty), price, {
        method: `UPI (${upiId.trim()})`,
        paymentId: data.paymentId,
      });

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Payment of ₹${total.toLocaleString('en-IN', { maximumFractionDigits: 2 })} successful via UPI (${data.paymentId})! Bought ${qty} share(s) of ${stock.symbol?.replace('.NS', '')}.`,
        });
        setTimeout(onClose, 2500);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'UPI transaction failed.' });
    } finally {
      setLoading(false);
    }
  };

  // BUY via Razorpay
  const handleBuyWithRazorpay = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) throw new Error('Razorpay SDK failed to load.');

      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          notes: {
            symbol: stock.symbol,
            qty,
            purpose: 'Instant Stock Buy',
          },
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || orderData.error || 'Failed to create payment order');
      }

      const { order, keyId } = orderData;

      const options = {
        key: keyId,
        amount: order.amount,
        currency: 'INR',
        name: 'Stock.io',
        description: `Buy ${qty} share(s) of ${stock.symbol?.replace('.NS', '')}`,
        image: 'https://cdn-icons-png.flaticon.com/512/2454/2454269.png',
        order_id: order.id,
        prefill: {
          name: user?.name || 'Stock.io Investor',
          email: user?.email || 'investor@stock.io',
          contact: '9999999999',
        },
        theme: {
          color: '#00ff64',
          backdrop_color: 'rgba(2, 13, 6, 0.9)',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: total,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.message || 'Payment signature verification failed.');
            }

            const result = buyStock(stock.symbol, stock.shortName, parseInt(qty), price, {
              method: 'Razorpay Gateway',
              paymentId: response.razorpay_payment_id,
            });

            if (result.success) {
              setMessage({
                type: 'success',
                text: `Payment successful! Bought ${qty} share(s) of ${stock.symbol?.replace('.NS', '')}.`,
              });
              setTimeout(onClose, 2500);
            } else {
              setMessage({ type: 'error', text: result.error });
            }
          } catch (vErr) {
            setMessage({ type: 'error', text: vErr.message || 'Payment verification failed' });
          } finally {
            setLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setMessage({ type: 'error', text: `Payment failed: ${resp.error.description}` });
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Payment initiation failed' });
      setLoading(false);
    }
  };

  // SELL with Instant Payout to UPI
  const handleSellWithUpiPayout = async () => {
    if (!sellUpiId || !sellUpiId.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid UPI ID for receiving sale proceeds' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          method: 'UPI',
          bankDetails: { upiId: sellUpiId.trim() },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to process payout');
      }

      const result = sellStock(stock.symbol, parseInt(qty), price, {
        method: 'Instant UPI Payout',
        utr: data.utr,
        destination: sellUpiId.trim(),
      });

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Sold ${qty} share(s)! ₹${total.toLocaleString('en-IN', { maximumFractionDigits: 2 })} disbursed instantly to ${sellUpiId} (UTR: ${data.utr}).`,
        });
        setTimeout(onClose, 3000);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Sale payout failed' });
    } finally {
      setLoading(false);
    }
  };

  // Standard Submit
  const handleSubmit = () => {
    if (qty < 1) return;

    if (mode === 'buy') {
      if (paymentSource === 'UPI') {
        handleBuyWithUpi();
        return;
      }
      if (paymentSource === 'RAZORPAY') {
        handleBuyWithRazorpay();
        return;
      }

      // Wallet
      const result = buyStock(stock.symbol, stock.shortName, parseInt(qty), price, { method: 'WALLET' });
      if (result.success) {
        setMessage({
          type: 'success',
          text: `Successfully bought ${qty} share(s) of ${stock.symbol?.replace('.NS', '')} from Wallet balance.`,
        });
        setTimeout(onClose, 2000);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } else {
      // SELL
      if (payoutDest === 'UPI') {
        handleSellWithUpiPayout();
        return;
      }

      // Wallet credit
      const result = sellStock(stock.symbol, parseInt(qty), price, { method: 'WALLET' });
      if (result.success) {
        setMessage({
          type: 'success',
          text: `Successfully sold ${qty} share(s) of ${stock.symbol?.replace('.NS', '')}. ₹${total.toLocaleString('en-IN', { maximumFractionDigits: 2 })} credited to Wallet.`,
        });
        setTimeout(onClose, 2000);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    }
  };

  if (!stock) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box buysell-enhanced-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-symbol">{stock.symbol?.replace('.NS', '')}</div>
            <div className="modal-name">{stock.shortName}</div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* LTP Price banner */}
        <div className="modal-price">
          <span className="modal-price-label">LTP</span>
          <span className="modal-price-value">
            ₹{price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
          <span
            className={`modal-price-chg ${(stock.regularMarketChangePercent || 0) >= 0 ? 'pos' : 'neg'}`}
          >
            {(stock.regularMarketChangePercent || 0) >= 0 ? '+' : ''}
            {stock.regularMarketChangePercent?.toFixed(2)}%
          </span>
        </div>

        {/* Buy / Sell Tabs */}
        <div className="modal-tabs">
          <button
            className={`modal-tab buy ${mode === 'buy' ? 'active' : ''}`}
            onClick={() => {
              setMode('buy');
              setMessage(null);
            }}
          >
            <TrendingUp size={14} /> Buy
          </button>
          <button
            className={`modal-tab sell ${mode === 'sell' ? 'active' : ''}`}
            onClick={() => {
              setMode('sell');
              setMessage(null);
            }}
          >
            <TrendingDown size={14} /> Sell
          </button>
        </div>

        <div className="modal-body">
          {/* Holdings & Balance rows */}
          <div className="modal-info-row">
            <span>
              <IndianRupee size={13} /> Available Wallet Balance
            </span>
            <span className="modal-info-val">
              ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
          {holding && (
            <div className="modal-info-row">
              <span>
                <Package size={13} /> Holdings
              </span>
              <span className="modal-info-val">
                {holding.qty} shares @ ₹{holding.avgPrice?.toFixed(2)}
              </span>
            </div>
          )}

          {/* Quantity Controls */}
          <div className="modal-input-group">
            <label>Quantity</label>
            <div className="qty-control">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))}>
                −
              </button>
              <input
                type="number"
                className="input"
                value={qty}
                min="1"
                max={mode === 'sell' ? holding?.qty || 1 : 9999}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <button
                type="button"
                onClick={() => setQty(qty + 1)}
                disabled={mode === 'sell' && qty >= (holding?.qty || 0)}
              >
                +
              </button>
            </div>
          </div>

          {/* ──────────────── BUY PAYMENT OPTIONS ──────────────── */}
          {mode === 'buy' && (
            <div className="payment-options-block">
              <div className="payment-options-label">
                <CreditCard size={13} /> Payment Source
              </div>
              <div className="payment-options-grid">
                <button
                  type="button"
                  className={`payment-option-btn ${paymentSource === 'WALLET' ? 'active' : ''}`}
                  onClick={() => setPaymentSource('WALLET')}
                >
                  <Wallet size={14} /> Wallet
                  <span className="option-sub">₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </button>
                <button
                  type="button"
                  className={`payment-option-btn ${paymentSource === 'UPI' ? 'active' : ''}`}
                  onClick={() => setPaymentSource('UPI')}
                >
                  <Smartphone size={14} /> Direct UPI
                  <span className="option-sub">Instant App/QR</span>
                </button>
                <button
                  type="button"
                  className={`payment-option-btn ${paymentSource === 'RAZORPAY' ? 'active' : ''}`}
                  onClick={() => setPaymentSource('RAZORPAY')}
                >
                  <Zap size={14} /> Razorpay
                  <span className="option-sub">Cards/NetBank</span>
                </button>
              </div>

              {/* UPI details input if UPI selected */}
              {paymentSource === 'UPI' && (
                <div className="buysell-upi-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="buysell-sublabel">Your UPI ID</label>
                    <button
                      type="button"
                      className="test-vpa-pill"
                      onClick={() => setUpiId('success@razorpay')}
                    >
                      ⚡ Test VPA (success@razorpay)
                    </button>
                  </div>
                  <input
                    type="text"
                    className="buysell-subinput"
                    placeholder="e.g. 9876543210@paytm or name@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                  <div className="handle-pills-mini">
                    {POPULAR_HANDLES.map((h) => (
                      <button
                        key={h}
                        type="button"
                        className="handle-pill-mini"
                        onClick={() => handleHandleAppend(h)}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Shortfall warning if Wallet chosen but balance low */}
              {isBalanceShortfall && (
                <div className="buysell-shortfall-alert">
                  <AlertCircle size={15} />
                  <div>
                    <span>Shortfall of ₹{(total - balance).toLocaleString('en-IN', { maximumFractionDigits: 2 })}.</span>
                    <button
                      type="button"
                      className="shortfall-switch-btn"
                      onClick={() => setPaymentSource('UPI')}
                    >
                      Pay directly via UPI instead
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ──────────────── SELL PAYOUT OPTIONS ──────────────── */}
          {mode === 'sell' && (
            <div className="payment-options-block">
              <div className="payment-options-label">
                <IndianRupee size={13} /> Sale Proceeds Destination
              </div>
              <div className="payment-options-grid sell-grid">
                <button
                  type="button"
                  className={`payment-option-btn ${payoutDest === 'WALLET' ? 'active' : ''}`}
                  onClick={() => setPayoutDest('WALLET')}
                >
                  <Wallet size={14} /> Trading Wallet
                  <span className="option-sub">Instant Credit</span>
                </button>
                <button
                  type="button"
                  className={`payment-option-btn ${payoutDest === 'UPI' ? 'active' : ''}`}
                  onClick={() => setPayoutDest('UPI')}
                >
                  <Smartphone size={14} /> Instant UPI Payout
                  <span className="option-sub">Direct to Bank</span>
                </button>
              </div>

              {payoutDest === 'UPI' && (
                <div className="buysell-upi-box">
                  <label className="buysell-sublabel">Receive Proceeds in UPI ID</label>
                  <input
                    type="text"
                    className="buysell-subinput"
                    placeholder="e.g. yourname@okhdfcbank"
                    value={sellUpiId}
                    onChange={(e) => setSellUpiId(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Total & Summary */}
          <div className="modal-summary">
            <div className="modal-summary-row">
              <span>Price × Qty</span>
              <span>
                ₹{price.toFixed(2)} × {qty}
              </span>
            </div>
            <div className="modal-summary-row total">
              <span>Total {mode === 'buy' ? 'Payable' : 'Receivable'}</span>
              <span className={mode === 'buy' ? 'text-green' : 'text-amber'}>
                ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {message && <div className={`modal-message ${message.type}`}>{message.text}</div>}

          {/* Submit Button */}
          <button
            className={`modal-submit ${mode}`}
            onClick={handleSubmit}
            disabled={
              loading ||
              (mode === 'buy' && isBalanceShortfall) ||
              (mode === 'sell' && (!holding || qty > (holding?.qty || 0)))
            }
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Loader2 size={16} className="spinner-icon" /> Processing...
              </span>
            ) : mode === 'buy' ? (
              paymentSource === 'UPI' ? (
                `Pay ₹${total.toLocaleString('en-IN', { maximumFractionDigits: 0 })} via UPI & Buy`
              ) : paymentSource === 'RAZORPAY' ? (
                `Pay ₹${total.toLocaleString('en-IN', { maximumFractionDigits: 0 })} via Razorpay & Buy`
              ) : (
                `Buy ${qty} Share${qty > 1 ? 's' : ''} (Wallet)`
              )
            ) : payoutDest === 'UPI' ? (
              `Sell & Disburse ₹${total.toLocaleString('en-IN', { maximumFractionDigits: 0 })} to UPI`
            ) : (
              `Sell ${qty} Share${qty > 1 ? 's' : ''} (Credit Wallet)`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuySellModal;
