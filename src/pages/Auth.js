// src/pages/Auth.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Eye, EyeOff, User, Mail, Lock, ArrowRight } from 'lucide-react';
import './Auth.css';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/dashboard'); }, [user]);

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = mode === 'login'
      ? login(form.email, form.password)
      : signup(form.name, form.email, form.password);
    if (result.success) navigate('/dashboard');
    else setError(result.error);
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb1" />
        <div className="auth-orb2" />
      </div>

      <div className="auth-container">
        {/* Left panel */}
        <div className="auth-left">
          <Link to="/" className="auth-logo">
            <TrendingUp size={24} style={{color:'var(--green-primary)'}} />
            <span>Stock<span style={{color:'var(--green-primary)'}}>Vision</span></span>
          </Link>
          <div className="auth-left-content">
            <h2>India's Smartest<br />Trading Platform</h2>
            <p>Real-time NSE/BSE data, AI predictions, and portfolio management — all in one place.</p>
            <div className="auth-features">
              {['Live NSE & BSE quotes', 'AI stock predictions', 'Portfolio tracking', 'Risk analysis'].map((f, i) => (
                <div key={i} className="auth-feat">
                  <span className="auth-check">✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <div className="auth-virtual-note">
              <span className="badge badge-gold">📌 Virtual Trading</span>
              <span>Start with ₹1,00,000 virtual money — no real money needed!</span>
            </div>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="auth-right">
          <div className="auth-form-box">
            <div className="auth-tabs">
              <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>Sign In</button>
              <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setError(''); }}>Sign Up</button>
            </div>

            <h3 className="auth-form-title">
              {mode === 'login' ? 'Welcome back 👋' : 'Create your account'}
            </h3>
            <p className="auth-form-sub">
              {mode === 'login' ? 'Sign in to access your dashboard' : 'Join 15,000+ traders on stock.io'}
            </p>

            <form onSubmit={handle} className="auth-form">
              {mode === 'signup' && (
                <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-wrap">
                    <User size={16} className="input-icon" />
                    <input
                      className="input input-with-icon"
                      type="text"
                      placeholder="Rahul Sharma"
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrap">
                  <Mail size={16} className="input-icon" />
                  <input
                    className="input input-with-icon"
                    type="email"
                    placeholder="rahul@example.com"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-wrap">
                  <Lock size={16} className="input-icon" />
                  <input
                    className="input input-with-icon"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    required
                    minLength={6}
                  />
                  <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="btn-primary" style={{width:'100%', justifyContent:'center', padding:'14px'}} disabled={loading}>
                {loading ? <div className="spinner" style={{width:18,height:18,borderWidth:2}} /> : (
                  <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <p className="auth-switch">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
