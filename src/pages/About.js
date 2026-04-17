// src/pages/About.js
import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Brain, Shield, Zap, Users, Globe, Award, ArrowRight, Github, Twitter, Linkedin } from 'lucide-react';
import './About.css';

const team = [
  { name: 'Arjun Mehta', role: 'CEO & Co-Founder', desc: 'Ex-Goldman Sachs quant trader with 12 years in Indian markets', initials: 'AM' },
  { name: 'Priya Nair', role: 'CTO & Co-Founder', desc: 'PhD in Machine Learning, ex-Google AI Research', initials: 'PN' },
  { name: 'Vikram Shah', role: 'Head of Data Science', desc: 'Built predictive models for NSE HFT operations for 8 years', initials: 'VS' },
  { name: 'Deepa Krishnan', role: 'Head of Product', desc: 'Previously at Zerodha and Groww, fintech product specialist', initials: 'DK' },
];

const milestones = [
  { year: '2021', event: 'stock.io founded in Bengaluru with seed funding' },
  { year: '2022', event: 'Launched beta with 500 early traders, first AI prediction model deployed' },
  { year: '2023', event: 'Series A funding of ₹50 crore, expanded to 10,000+ users' },
  { year: '2024', event: 'Launched Anomaly Detector & Risk AI; partnerships with 3 major brokers' },
  { year: '2025', event: '15,000+ active traders, 99.2% uptime, SEBI recognized fintech startup' },
];

const About = () => (
  <div className="page-wrapper about-page">
    {/* Hero */}
    <section className="about-hero">
      <div className="about-hero-bg" />
      <div className="container">
        <div className="section-label center">ABOUT STOCKVISION</div>
        <h1 className="about-hero-title">
          We're on a Mission to<br />
          <span className="text-green glow-text">Democratize</span> Indian Trading
        </h1>
        <p className="about-hero-sub">
          stock.io was born from a simple belief: every Indian investor deserves the same
          AI-powered tools that institutional traders use. We're leveling the playing field.
        </p>
        <div className="about-stats">
          {[
            { val: '15K+', label: 'Active Traders' },
            { val: '₹480Cr+', label: 'Virtual Trades' },
            { val: '500+', label: 'NSE Stocks' },
            { val: '98.7%', label: 'AI Accuracy' },
          ].map((s, i) => (
            <div key={i} className="about-stat">
              <span className="about-stat-val">{s.val}</span>
              <span className="about-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Mission */}
    <section className="section">
      <div className="container">
        <div className="mission-grid">
          <div className="mission-content">
            <div className="section-label">OUR MISSION</div>
            <h2 className="section-title">Built for Bharat's<br />Next-Gen Traders</h2>
            <p style={{ color:'var(--text-secondary)', lineHeight:1.8, marginBottom:20, fontSize:15 }}>
              India has over 150 million demat accounts, but fewer than 10% of investors
              have access to sophisticated analytical tools. We built stock.io to change that.
            </p>
            <p style={{ color:'var(--text-secondary)', lineHeight:1.8, fontSize:15 }}>
              Our platform combines real-time NSE & BSE data from Yahoo Finance API with four
              proprietary AI models — stock prediction, sentiment analysis, anomaly detection,
              and risk scoring — all accessible for free.
            </p>
          </div>
          <div className="mission-values">
            {[
              { icon: <Brain size={20} />, title: 'AI-First', desc: 'Every feature is powered by machine learning trained on Indian market data' },
              { icon: <Shield size={20} />, title: 'Transparent', desc: 'No hidden fees, no dark patterns. What you see is what you get.' },
              { icon: <Zap size={20} />, title: 'Real-time', desc: 'Sub-second data updates via Yahoo Finance API for accurate decisions' },
              { icon: <Users size={20} />, title: 'Community', desc: 'Built by traders for traders, with constant feedback integration' },
            ].map((v, i) => (
              <div key={i} className="mission-value">
                <span className="mv-icon">{v.icon}</span>
                <div>
                  <h4>{v.title}</h4>
                  <p>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Team */}
    <section className="section" style={{ background:'linear-gradient(180deg, transparent, rgba(0,255,100,0.02), transparent)' }}>
      <div className="container">
        <div className="section-label center">THE TEAM</div>
        <h2 className="section-title center">Meet the Builders</h2>
        <div className="team-grid">
          {team.map((member, i) => (
            <div key={i} className="team-card">
              <div className="team-avatar">{member.initials}</div>
              <h3>{member.name}</h3>
              <div className="team-role">{member.role}</div>
              <p>{member.desc}</p>
              <div className="team-social">
                <a href="#"><Linkedin size={14} /></a>
                <a href="#"><Twitter size={14} /></a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Timeline */}
    <section className="section">
      <div className="container">
        <div className="section-label center">OUR JOURNEY</div>
        <h2 className="section-title center">Milestones</h2>
        <div className="timeline">
          {milestones.map((m, i) => (
            <div key={i} className={`timeline-item ${i % 2 === 0 ? 'left' : 'right'}`}>
              <div className="timeline-year">{m.year}</div>
              <div className="timeline-dot" />
              <div className="timeline-content">{m.event}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Tech Stack */}
    <section className="section">
      <div className="container">
        <div className="section-label center">TECHNOLOGY</div>
        <h2 className="section-title center">Under the Hood</h2>
        <div className="tech-grid">
          {[
            { label: 'Data Source', value: 'Yahoo Finance API (NSE/BSE)', icon: <Globe size={18} /> },
            { label: 'Frontend', value: 'React 18 + Recharts', icon: <Zap size={18} /> },
            { label: 'Backend', value: 'Node.js + Express Proxy', icon: <Shield size={18} /> },
            { label: 'AI Engine', value: 'Python + TensorFlow + LSTM', icon: <Brain size={18} /> },
            { label: 'NLP Model', value: 'FinBERT fine-tuned on IN data', icon: <Brain size={18} /> },
            { label: 'Risk Model', value: 'Monte Carlo + VaR Simulations', icon: <Award size={18} /> },
          ].map((t, i) => (
            <div key={i} className="tech-card">
              <div className="tech-icon">{t.icon}</div>
              <div className="tech-label">{t.label}</div>
              <div className="tech-value">{t.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="section">
      <div className="container">
        <div className="cta-box">
          <div className="cta-orb" />
          <h2>Join the Revolution</h2>
          <p>Start with ₹1,00,000 virtual money. No credit card needed.</p>
          <Link to="/auth?mode=signup" className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
            Create Free Account <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default About;
