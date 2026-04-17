// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  TrendingUp, LayoutDashboard, Newspaper, Brain,
  BarChart2, AlertTriangle, Shield, User, LogOut,
  Menu, X, ChevronDown, SunMedium, MoonStar
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiDropdown, setAiDropdown] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/', label: 'Home', icon: <TrendingUp size={15} /> },
    ...(user ? [{ to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> }] : []),
    { to: '/news', label: 'News', icon: <Newspaper size={15} /> },
    { to: '/about', label: 'About', icon: <BarChart2 size={15} /> },
  ];

  const aiLinks = [
    { to: '/ai/prediction', label: 'Stock Prediction', icon: <Brain size={14} /> },
    { to: '/ai/sentiment', label: 'Sentiment Analysis', icon: <BarChart2 size={14} /> },
    { to: '/ai/anomaly', label: 'Anomaly Detector', icon: <AlertTriangle size={14} /> },
    { to: '/ai/risk', label: 'Risk Analysis', icon: <Shield size={14} /> },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon"><TrendingUp size={20} /></span>
          <span className="logo-text">stock<span className="logo-accent">.io</span></span>
          <span className="logo-tag">markets</span>
        </Link>

        <div className="nav-links">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} className={`nav-link ${isActive(link.to) ? 'active' : ''}`}>
              {link.icon}{link.label}
            </Link>
          ))}

          <div className="nav-dropdown" onMouseEnter={() => setAiDropdown(true)} onMouseLeave={() => setAiDropdown(false)}>
            <button className={`nav-link ${aiLinks.some(l => isActive(l.to)) ? 'active' : ''}`}>
              <Brain size={15} /> AI Models <ChevronDown size={12} className={aiDropdown ? 'rotated' : ''} />
            </button>
            {aiDropdown && (
              <div className="dropdown-menu">
                {aiLinks.map(link => (
                  <Link key={link.to} to={link.to} className={`dropdown-item ${isActive(link.to) ? 'active' : ''}`}>
                    {link.icon}{link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="nav-actions">
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? <SunMedium size={15} /> : <MoonStar size={15} />}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
          {user ? (
            <div className="user-menu">
              <div className="user-avatar">
                <User size={14} />
                <span>{user.name.split(' ')[0]}</span>
              </div>
              <button onClick={handleLogout} className="btn-secondary" style={{padding: '8px 16px', fontSize: '13px'}}>
                <LogOut size={14} /> Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/auth" className="btn-secondary" style={{padding: '8px 16px', fontSize: '13px'}}>Sign In</Link>
              <Link to="/auth?mode=signup" className="btn-primary" style={{padding: '8px 16px', fontSize: '13px'}}>Get Started</Link>
            </div>
          )}
        </div>

        <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="mobile-menu">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} className="mobile-link" onClick={() => setMobileOpen(false)}>
              {link.icon}{link.label}
            </Link>
          ))}
          <div className="mobile-divider">AI Models</div>
          {aiLinks.map(link => (
            <Link key={link.to} to={link.to} className="mobile-link" onClick={() => setMobileOpen(false)}>
              {link.icon}{link.label}
            </Link>
          ))}
          <button className="mobile-theme-toggle" onClick={toggleTheme}>
            {isDark ? <SunMedium size={16} /> : <MoonStar size={16} />}
            {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
          {!user && (
            <div style={{ padding: '12px 20px', display: 'flex', gap: '10px' }}>
              <Link to="/auth" className="btn-secondary" style={{flex: 1, justifyContent: 'center'}} onClick={() => setMobileOpen(false)}>Sign In</Link>
              <Link to="/auth?mode=signup" className="btn-primary" style={{flex: 1, justifyContent: 'center'}} onClick={() => setMobileOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
