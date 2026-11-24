// src/components/WalletModal.js
import React, { useState, useEffect } from 'react';
import {
  X,
  IndianRupee,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Building,
  Smartphone,
  CreditCard,
  ExternalLink,
  Loader2,
  QrCode,
  Zap,
  Info,
  Clock,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './WalletModal.css';

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000];

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', handle: '@okhdfcbank', color: '#4285F4' },
  { id: 'phonepe', name: 'PhonePe', handle: '@ybl', color: '#6739B7' },
  { id: 'paytm', name: 'Paytm', handle: '@paytm', color: '#00BAF2' },
  { id: 'bhim', name: 'BHIM UPI', handle: '@upi', color: '#00843D' },
];

const POPULAR_HANDLES = ['@okhdfcbank', '@okicici', '@oksbi', '@ybl', '@paytm', '@ibl'];

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

const WalletModal = ({ initialMode = 'deposit', onClose }) => {
  const { user, balance, depositFunds, withdrawFunds } = useAuth();
  const [activeTab, setActiveTab] = useState(initialMode); // 'deposit' | 'withdraw'

  // Deposit methods: 'UPI' | 'QR' | 'RAZORPAY_GATEWAY'
  const [depositMethod, setDepositMethod] = useState('UPI');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  // UPI specific state
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [upiWaitingApproval, setUpiWaitingApproval] = useState(false);
  const [qrTimer, setQrTimer] = useState(300); // 5 min countdown
  const [copiedVpa, setCopiedVpa] = useState(false);

  // Gateway status
  const [gatewayConfig, setGatewayConfig] = useState({ configured: false, keyId: null });
  const [checkingConfig, setCheckingConfig] = useState(true);

  // Withdrawal form fields
  const [withdrawMethod, setWithdrawMethod] = useState('UPI'); // 'UPI' | 'BANK'
  const [accountHolder, setAccountHolder] = useState(user?.name || '');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccount, setConfirmAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [withdrawUpiId, setWithdrawUpiId] = useState('');

  // Fetch Razorpay config
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
      } finally {
        setCheckingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  // Countdown timer for QR
  useEffect(() => {
    let interval = null;
    if (depositMethod === 'QR' && qrTimer > 0) {
      interval = setInterval(() => {
        setQrTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [depositMethod, qrTimer]);

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleHandleAppend = (suffix) => {
    const prefix = upiId.includes('@') ? upiId.split('@')[0] : upiId;
    setUpiId(`${prefix}${suffix}`);
  };

  // 1. Direct UPI Deposit (Instant VPA Collect)
  const handleUpiCollectSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 1) {
      setError('Please enter a deposit amount of at least ₹1');
      return;
    }

    if (!upiId || !upiId.includes('@')) {
      setError('Please enter a valid UPI ID (e.g. name@okhdfcbank or 9876543210@paytm)');
      return;
    }

    setLoading(true);

    // If Razorpay is active and user provided `success@razorpay` or wants Razorpay checkout
    if (gatewayConfig.configured && upiId.toLowerCase() === 'success@razorpay') {
      await handleRazorpayDeposit(numAmount, upiId);
      return;
    }

    // Direct Broker UPI Collect Request
    try {
      const res = await fetch('/api/payment/upi-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          upiId: upiId.trim(),
          upiApp: UPI_APPS.find((a) => a.id === selectedUpiApp)?.name || 'UPI',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'UPI collect request failed.');
      }

      depositFunds(numAmount, {
        paymentId: data.paymentId,
        method: data.method || 'Instant UPI',
      });

      setSuccessData({
        type: 'DEPOSIT',
        amount: numAmount,
        paymentId: data.paymentId,
        method: `UPI (${data.upiId})`,
        date: new Date().toISOString(),
      });
    } catch (err) {
      setError(err.message || 'UPI transaction failed.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Direct UPI QR Code Verification
  const handleQrVerifiedSubmit = async () => {
    setError('');
    const numAmount = parseFloat(amount) || 1000;
    setLoading(true);

    try {
      const res = await fetch('/api/payment/upi-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          upiId: 'scanned.qr@upi',
          upiApp: 'UPI QR Scanner',
          utr: `UTR${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'QR verification failed');
      }

      depositFunds(numAmount, {
        paymentId: data.paymentId,
        method: 'UPI Dynamic QR Code',
      });

      setSuccessData({
        type: 'DEPOSIT',
        amount: numAmount,
        paymentId: data.paymentId,
        method: 'UPI QR Code Scan',
        date: new Date().toISOString(),
      });
    } catch (err) {
      setError(err.message || 'Could not verify QR payment.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Razorpay Standard Checkout (All options + UPI)
  const handleRazorpayDeposit = async (customAmount = null, prefetchedVpa = null) => {
    setError('');
    const numAmount = customAmount || parseFloat(amount);

    if (isNaN(numAmount) || numAmount < 1) {
      setError('Please enter a valid deposit amount of at least ₹1');
      return;
    }

    if (!gatewayConfig.configured) {
      setError('Razorpay credentials not found in .env.');
      return;
    }

    setLoading(true);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) throw new Error('Razorpay SDK failed to load.');

      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          notes: {
            userName: user?.name || 'Investor',
            userEmail: user?.email || '',
            vpa: prefetchedVpa || upiId || undefined,
          },
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || orderData.error || 'Failed to create order');
      }

      const { order, keyId } = orderData;

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Stock.io',
        description: 'Wallet Deposit (UPI & Cards)',
        image: 'https://cdn-icons-png.flaticon.com/512/2454/2454269.png',
        order_id: order.id,
        prefill: {
          name: user?.name || 'Stock.io Trader',
          email: user?.email || 'trader@stock.io',
          contact: '9999999999',
          vpa: prefetchedVpa || (upiId ? upiId.trim() : undefined),
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
                amount: numAmount,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.message || 'Payment verification failed.');
            }

            depositFunds(numAmount, {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              method: 'Razorpay UPI & Cards',
            });

            setSuccessData({
              type: 'DEPOSIT',
              amount: numAmount,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              date: new Date().toISOString(),
            });
          } catch (verifyErr) {
            setError(verifyErr.message || 'Payment verification failed.');
          } finally {
            setLoading(false);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', (failResp) => {
        setError(`Payment failed: ${failResp.error.description || failResp.error.reason}`);
        setLoading(false);
      });

      razorpayInstance.open();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setLoading(false);
    }
  };

  // 4. Withdrawal Handler
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 10) {
      setError('Minimum withdrawal amount is ₹10');
      return;
    }

    if (numAmount > balance) {
      setError(`Insufficient balance. Available: ₹${balance.toLocaleString('en-IN')}`);
      return;
    }

    if (withdrawMethod === 'BANK') {
      if (!accountNumber || accountNumber.trim().length < 9) {
        setError('Please enter a valid bank account number (at least 9 digits)');
        return;
      }
      if (accountNumber !== confirmAccount) {
        setError('Account numbers do not match');
        return;
      }
      if (!ifsc || ifsc.trim().length !== 11) {
        setError('Please enter a valid 11-character IFSC code (e.g. HDFC0001234)');
        return;
      }
    } else {
      if (!withdrawUpiId || !withdrawUpiId.includes('@')) {
        setError('Please enter a valid UPI ID (e.g. yourname@okhdfcbank)');
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          method: withdrawMethod,
          bankDetails: {
            accountHolder,
            accountNumber,
            ifsc: ifsc.toUpperCase(),
            upiId: withdrawUpiId,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to process withdrawal');
      }

      withdrawFunds(numAmount, {
        utr: data.utr,
        method: withdrawMethod === 'BANK' ? 'IMPS Bank Transfer' : 'Instant UPI',
        accountNumberMasked: data.bankDetails?.accountNumberMasked,
        upiId: data.bankDetails?.upiId,
      });

      setSuccessData({
        type: 'WITHDRAWAL',
        amount: numAmount,
        utr: data.utr,
        method: withdrawMethod === 'BANK' ? 'Bank Account' : 'UPI',
        destination: withdrawMethod === 'BANK' ? `${data.bankDetails.accountNumberMasked} (${data.bankDetails.ifsc})` : data.bankDetails.upiId,
        date: new Date().toISOString(),
      });
    } catch (err) {
      setError(err.message || 'Failed to process withdrawal.');
    } finally {
      setLoading(false);
    }
  };

  const handlePercentageSelect = (pct) => {
    const calc = Math.floor((balance * pct) / 100);
    setAmount(calc > 0 ? calc.toString() : '');
  };

  const currentAmountNum = parseFloat(amount) || 1000;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=00ff64&bgcolor=06150a&margin=10&data=${encodeURIComponent(
    `upi://pay?pa=stockio.broker@icici&pn=Stock.io&am=${currentAmountNum}&cu=INR&tn=Wallet%20Deposit`
  )}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box wallet-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-symbol" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={18} className="text-green" /> Funds & Wallet
            </div>
            <div className="modal-name">
              Available Balance:{' '}
              <strong className="text-green">
                ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </strong>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="wallet-tabs">
          <button
            className={`wallet-tab-btn ${activeTab === 'deposit' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('deposit');
              setError('');
              setSuccessData(null);
            }}
          >
            <ArrowDownLeft size={16} /> Add Money (UPI & Cards)
          </button>
          <button
            className={`wallet-tab-btn ${activeTab === 'withdraw' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('withdraw');
              setError('');
              setSuccessData(null);
            }}
          >
            <ArrowUpRight size={16} /> Withdraw Funds
          </button>
        </div>

        {/* SUCCESS RECEIPT */}
        {successData ? (
          <div className="wallet-success-screen">
            <div className="wallet-success-icon">
              <CheckCircle size={54} className="text-green" />
            </div>
            <h2 className="wallet-success-title">
              {successData.type === 'DEPOSIT' ? 'Funds Added Successfully!' : 'Withdrawal Processed!'}
            </h2>
            <div className="wallet-success-amount">
              ₹{successData.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <p className="wallet-success-sub">
              {successData.type === 'DEPOSIT'
                ? 'Your trading wallet balance has been updated immediately.'
                : `Disbursed to your ${successData.method} via instant clearing network.`}
            </p>

            <div className="wallet-receipt-card">
              <div className="receipt-row">
                <span>Method</span>
                <strong>{successData.method || (successData.type === 'DEPOSIT' ? 'UPI Transfer' : 'Bank Transfer')}</strong>
              </div>
              {successData.paymentId && (
                <div className="receipt-row">
                  <span>Reference ID</span>
                  <span className="receipt-mono">{successData.paymentId}</span>
                </div>
              )}
              {successData.utr && (
                <div className="receipt-row">
                  <span>UTR Reference</span>
                  <span className="receipt-mono">{successData.utr}</span>
                </div>
              )}
              {successData.destination && (
                <div className="receipt-row">
                  <span>Transferred To</span>
                  <span>{successData.destination}</span>
                </div>
              )}
              <div className="receipt-row">
                <span>Updated Balance</span>
                <strong className="text-green">₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
              </div>
            </div>

            <button
              className="btn-primary wallet-action-btn"
              onClick={() => {
                setSuccessData(null);
                setAmount('');
                onClose();
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="wallet-modal-body">
            {/* ──────────────── DEPOSIT TAB ──────────────── */}
            {activeTab === 'deposit' && (
              <div>
                {/* Amount input */}
                <div className="wallet-field-wrap">
                  <label className="wallet-label">Enter Amount to Add</label>
                  <div className="wallet-input-affix">
                    <span className="wallet-affix">
                      <IndianRupee size={16} />
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="e.g. 5000"
                      className="wallet-input"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setError('');
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="preset-chips">
                  {PRESET_AMOUNTS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      className="preset-chip"
                      onClick={() => setAmount(val.toString())}
                    >
                      +₹{val.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>

                {/* Deposit Sub-Method Switcher */}
                <div className="upi-method-selector">
                  <button
                    type="button"
                    className={`upi-sub-btn ${depositMethod === 'UPI' ? 'active' : ''}`}
                    onClick={() => {
                      setDepositMethod('UPI');
                      setError('');
                    }}
                  >
                    <Smartphone size={15} /> Instant UPI ID
                  </button>
                  <button
                    type="button"
                    className={`upi-sub-btn ${depositMethod === 'QR' ? 'active' : ''}`}
                    onClick={() => {
                      setDepositMethod('QR');
                      setError('');
                    }}
                  >
                    <QrCode size={15} /> Scan UPI QR
                  </button>
                  <button
                    type="button"
                    className={`upi-sub-btn ${depositMethod === 'RAZORPAY_GATEWAY' ? 'active' : ''}`}
                    onClick={() => {
                      setDepositMethod('RAZORPAY_GATEWAY');
                      setError('');
                    }}
                  >
                    <CreditCard size={15} /> Razorpay Cards/NetBanking
                  </button>
                </div>

                {/* SUB-METHOD 1: DIRECT UPI ID */}
                {depositMethod === 'UPI' && (
                  <form onSubmit={handleUpiCollectSubmit} className="upi-form-block">
                    <div className="upi-app-strip">
                      {UPI_APPS.map((app) => (
                        <button
                          key={app.id}
                          type="button"
                          className={`upi-app-btn ${selectedUpiApp === app.id ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedUpiApp(app.id);
                            handleHandleAppend(app.handle);
                          }}
                        >
                          <span className="app-dot" style={{ backgroundColor: app.color }} />
                          {app.name}
                        </button>
                      ))}
                    </div>

                    <div className="wallet-field-wrap">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label className="wallet-sublabel" style={{ margin: 0 }}>
                          Your UPI ID / Virtual Payment Address (VPA)
                        </label>
                        <button
                          type="button"
                          className="test-upi-link"
                          onClick={() => setUpiId('success@razorpay')}
                        >
                          ⚡ Use Test VPA (success@razorpay)
                        </button>
                      </div>

                      <div className="upi-input-group">
                        <input
                          type="text"
                          className="wallet-subinput"
                          placeholder="e.g. 9876543210@paytm or yourname@okhdfcbank"
                          value={upiId}
                          onChange={(e) => {
                            setUpiId(e.target.value);
                            setError('');
                          }}
                          required
                        />
                      </div>

                      {/* Quick handle pills */}
                      <div className="handle-pills">
                        {POPULAR_HANDLES.map((h) => (
                          <button
                            key={h}
                            type="button"
                            className="handle-pill"
                            onClick={() => handleHandleAppend(h)}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="upi-info-badge">
                      <Zap size={14} className="text-green" />
                      <span>
                        Enter your UPI ID to trigger an instant collect request on your mobile UPI app.
                      </span>
                    </div>

                    {error && (
                      <div className="wallet-error-msg">
                        <AlertCircle size={14} /> {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn-primary wallet-action-btn upi-pay-btn"
                      disabled={loading || !amount || parseFloat(amount) < 1 || !upiId}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="spinner-icon" /> Sending UPI Collect Request...
                        </>
                      ) : (
                        <>
                          <Zap size={16} /> Pay ₹{amount ? parseFloat(amount).toLocaleString('en-IN') : '0'} via UPI
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* SUB-METHOD 2: DYNAMIC UPI QR CODE */}
                {depositMethod === 'QR' && (
                  <div className="qr-container-block">
                    <div className="qr-card">
                      <div className="qr-header">
                        <span className="qr-merchant-title">Stock.io Investments</span>
                        <span className="qr-timer">
                          <Clock size={12} /> Expires in {formatTimer(qrTimer)}
                        </span>
                      </div>

                      <div className="qr-image-wrapper">
                        <img src={qrCodeUrl} alt="UPI QR Code" className="qr-image" />
                      </div>

                      <div className="qr-amount-pill">
                        ₹{currentAmountNum.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </div>

                      <div className="vpa-copy-row">
                        <span className="vpa-text">UPI ID: stockio.broker@icici</span>
                        <button
                          type="button"
                          className="copy-btn"
                          onClick={() => {
                            navigator.clipboard?.writeText('stockio.broker@icici');
                            setCopiedVpa(true);
                            setTimeout(() => setCopiedVpa(false), 2000);
                          }}
                        >
                          {copiedVpa ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                        </button>
                      </div>

                      <div className="qr-app-logos">
                        <span>Scan with any UPI App:</span>
                        <div className="app-tags">
                          <span>GPay</span>
                          <span>PhonePe</span>
                          <span>Paytm</span>
                          <span>BHIM</span>
                          <span>Cred</span>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="wallet-error-msg">
                        <AlertCircle size={14} /> {error}
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn-primary wallet-action-btn qr-verify-btn"
                      onClick={handleQrVerifiedSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="spinner-icon" /> Verifying Payment...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} /> I've Scanned & Paid ₹{currentAmountNum.toLocaleString('en-IN')}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* SUB-METHOD 3: RAZORPAY FULL CHECKOUT */}
                {depositMethod === 'RAZORPAY_GATEWAY' && (
                  <div>
                    {gatewayConfig.configured ? (
                      <div className="gateway-badge-active">
                        <ShieldCheck size={16} className="text-green" />
                        <span>Razorpay Gateway Active (Key: {gatewayConfig.keyId?.slice(0, 10)}...)</span>
                      </div>
                    ) : (
                      <div className="gateway-warning-box">
                        <AlertCircle size={18} className="text-amber" />
                        <div>
                          <strong>Razorpay Keys Required</strong>
                          <p>
                            Add test keys to <code className="env-code">.env</code>:
                          </p>
                          <pre className="env-snippet">{`RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...`}</pre>
                        </div>
                      </div>
                    )}

                    <div className="razorpay-instruments-info">
                      <p>
                        Opens Razorpay's official checkout popup supporting Cards, NetBanking (SBI, HDFC, ICICI, Axis), EMI, and Razorpay UPI.
                      </p>
                      <div className="test-vpa-hint">
                        <Info size={14} className="text-amber" />
                        <span>
                          <strong>Test Mode Tip:</strong> When paying with UPI inside Razorpay test mode, use UPI ID{' '}
                          <code>success@razorpay</code>.
                        </span>
                      </div>
                    </div>

                    {error && (
                      <div className="wallet-error-msg">
                        <AlertCircle size={14} /> {error}
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn-primary wallet-action-btn"
                      onClick={() => handleRazorpayDeposit()}
                      disabled={loading || !amount || parseFloat(amount) < 1}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="spinner-icon" /> Opening Razorpay Popup...
                        </>
                      ) : (
                        <>
                          Pay ₹{amount ? parseFloat(amount).toLocaleString('en-IN') : '0'} via Razorpay
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ──────────────── WITHDRAW TAB ──────────────── */}
            {activeTab === 'withdraw' && (
              <form onSubmit={handleWithdrawSubmit}>
                {/* Available for withdraw banner */}
                <div className="withdraw-avail-banner">
                  <span>Available to Withdraw:</span>
                  <strong>₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                </div>

                {/* Amount input */}
                <div className="wallet-field-wrap">
                  <label className="wallet-label">Withdrawal Amount</label>
                  <div className="wallet-input-affix">
                    <span className="wallet-affix">
                      <IndianRupee size={16} />
                    </span>
                    <input
                      type="number"
                      min="10"
                      max={balance}
                      step="any"
                      placeholder="e.g. 2500"
                      className="wallet-input"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setError('');
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Percentage chips */}
                <div className="preset-chips">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      className="preset-chip"
                      onClick={() => handlePercentageSelect(pct)}
                    >
                      {pct === 100 ? 'Max (100%)' : `${pct}%`}
                    </button>
                  ))}
                </div>

                {/* Method selector */}
                <div className="wallet-field-wrap">
                  <label className="wallet-label">Disbursement Destination</label>
                  <div className="withdraw-method-grid">
                    <button
                      type="button"
                      className={`method-select-btn ${withdrawMethod === 'UPI' ? 'selected' : ''}`}
                      onClick={() => setWithdrawMethod('UPI')}
                    >
                      <Smartphone size={16} /> Instant UPI (Zero Fee)
                    </button>
                    <button
                      type="button"
                      className={`method-select-btn ${withdrawMethod === 'BANK' ? 'selected' : ''}`}
                      onClick={() => setWithdrawMethod('BANK')}
                    >
                      <Building size={16} /> Bank Account (IMPS)
                    </button>
                  </div>
                </div>

                {/* UPI field */}
                {withdrawMethod === 'UPI' && (
                  <div className="wallet-field-wrap">
                    <label className="wallet-sublabel">Your UPI ID / VPA</label>
                    <input
                      type="text"
                      className="wallet-subinput"
                      placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                      value={withdrawUpiId}
                      onChange={(e) => setWithdrawUpiId(e.target.value)}
                      required
                    />
                  </div>
                )}

                {/* Bank account fields */}
                {withdrawMethod === 'BANK' && (
                  <div className="bank-fields-grid">
                    <div>
                      <label className="wallet-sublabel">Account Holder Name</label>
                      <input
                        type="text"
                        className="wallet-subinput"
                        placeholder="Name as per Bank"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="wallet-sublabel">Account Number</label>
                      <input
                        type="password"
                        className="wallet-subinput"
                        placeholder="Bank Account Number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="wallet-sublabel">Confirm Account Number</label>
                      <input
                        type="text"
                        className="wallet-subinput"
                        placeholder="Re-enter Account Number"
                        value={confirmAccount}
                        onChange={(e) => setConfirmAccount(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="wallet-sublabel">IFSC Code</label>
                      <input
                        type="text"
                        maxLength="11"
                        className="wallet-subinput uppercase-input"
                        placeholder="e.g. HDFC0001234"
                        value={ifsc}
                        onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="payout-note">
                  <ShieldCheck size={14} className="text-green" />
                  <span>Withdrawals are processed instantly via UPI/IMPS clearing network.</span>
                </div>

                {error && (
                  <div className="wallet-error-msg">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary wallet-action-btn withdraw-btn"
                  disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spinner-icon" /> Processing Withdrawal...
                    </>
                  ) : (
                    <>
                      Withdraw ₹{amount ? parseFloat(amount).toLocaleString('en-IN') : '0'} to {withdrawMethod === 'BANK' ? 'Bank' : 'UPI'}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletModal;
