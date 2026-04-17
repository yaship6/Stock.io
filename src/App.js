// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import TickerTape from './components/TickerTape';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import News from './pages/News';
import About from './pages/About';
import AIPrediction from './pages/AIPrediction';
import AISentiment from './pages/AISentiment';
import AIAnomaly from './pages/AIAnomaly';
import AIRisk from './pages/AIRisk';
import './index.css';

const Footer = () => (
  <footer style={{
    borderTop: '1px solid var(--border)',
    padding: '40px 0 24px',
    marginTop: 'auto',
    background: 'linear-gradient(180deg, transparent, var(--bg-secondary))',
  }}>
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>
            stock<span style={{ color: 'var(--green-primary)' }}>.io</span>
          </span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', background: 'var(--badge-bg)', color: 'var(--green-primary)', padding: '2px 6px', borderRadius: 3 }}>BROKER UI</span>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Home', to: '/' },
            { label: 'Dashboard', to: '/dashboard' },
            { label: 'News', to: '/news' },
            { label: 'About', to: '/about' },
            { label: 'AI Models', to: '/ai/prediction' },
          ].map((link) => (
            <Link key={link.label} to={link.to} style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
              {link.label}
            </Link>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          © 2026 stock.io • Data: Yahoo Finance + News API
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        stock.io is for educational purposes only. Virtual trading only. Not SEBI registered investment advice.
      </div>
    </div>
  </footer>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <TickerTape />
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/news" element={<News />} />
                <Route path="/about" element={<About />} />
                <Route path="/ai/prediction" element={<AIPrediction />} />
                <Route path="/ai/sentiment" element={<AISentiment />} />
                <Route path="/ai/anomaly" element={<AIAnomaly />} />
                <Route path="/ai/risk" element={<AIRisk />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
