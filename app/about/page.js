"use client";

import Link from "next/link";

export default function About() {
  return (
    <div style={pageStyle}>
      
      {/* ================= NAVBAR ================= */}
      <nav style={navStyle}>
        
        <Link href="/" style={{ textDecoration: "none" }}>
  <div style={logoStyle}>
    <span style={{ color: "#ffffff" }}>Stock</span>
    <span style={{ color: "#00ffae" }}>.io</span>
  </div>
</Link>

        {/* NAV LINKS */}
        <div style={navLinks}>
  <Link href="/" className="nav-link">Home</Link>
  <Link href="/market" className="nav-link">Market Activity</Link>
  <Link href="/news" className="nav-link">News & Insight</Link>
  <Link href="/about" className="nav-link">About</Link>
</div>

        {/* SIGN IN */}
        <Link href="/login">
          <button style={loginBtn}>Sign In</button>
        </Link>

      </nav>

      {/* ================= HERO SECTION ================= */}
      <div style={heroSection}>
        <div style={heroContent}>
          <h1 style={heroTitle}>
            About <span style={highlight}>Stock.io</span>
          </h1>
          <p style={heroText}>
            Revolutionizing investment intelligence through cutting-edge AI technology.
            We empower investors with real-time insights, predictive analytics, and
            data-driven decision making tools.
          </p>
        </div>
      </div>

      {/* ================= MISSION SECTION ================= */}
      <div style={missionSection}>
        <div style={container}>
          <h2 style={sectionTitle}>Our Mission</h2>
          <p style={missionText}>
            To democratize access to professional-grade investment tools and make
            sophisticated market analysis available to every investor. We believe
            that with the right technology, anyone can make smarter investment decisions.
          </p>
        </div>
      </div>

      {/* ================= FEATURES GRID ================= */}
      <div style={featuresSection}>
        <div style={container}>
          <h2 style={sectionTitle}>What Sets Us Apart</h2>
          <div style={featuresGrid}>
            <div style={featureCard} className="feature-card">
              <div style={featureIcon}>🤖</div>
              <h3 style={featureTitle}>AI-Powered Insights</h3>
              <p style={featureText}>
                Advanced machine learning algorithms analyze market trends,
                news sentiment, and historical data to provide actionable insights.
              </p>
            </div>

            <div style={featureCard} className="feature-card">
              <div style={featureIcon}>📊</div>
              <h3 style={featureTitle}>Real-Time Data</h3>
              <p style={featureText}>
                Live market data, instant price updates, and real-time
                notifications keep you informed of every market movement.
              </p>
            </div>

            <div style={featureCard} className="feature-card">
              <div style={featureIcon}>🎯</div>
              <h3 style={featureTitle}>Smart Analytics</h3>
              <p style={featureText}>
                Predictive modeling and risk assessment tools help you
                identify opportunities and manage portfolio risk effectively.
              </p>
            </div>

            <div style={featureCard} className="feature-card">
              <div style={featureIcon}>📰</div>
              <h3 style={featureTitle}>News Integration</h3>
              <p style={featureText}>
                Curated financial news and market analysis from trusted
                sources, filtered and prioritized by our AI systems.
              </p>
            </div>

            <div style={featureCard} className="feature-card">
              <div style={featureIcon}>📈</div>
              <h3 style={featureTitle}>Portfolio Tracking</h3>
              <p style={featureText}>
                Comprehensive portfolio management with performance tracking,
                diversification analysis, and automated rebalancing suggestions.
              </p>
            </div>

            <div style={featureCard} className="feature-card">
              <div style={featureIcon}>🔒</div>
              <h3 style={featureTitle}>Secure & Reliable</h3>
              <p style={featureText}>
                Bank-level security with encrypted data storage and
                secure API integrations you can trust.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= HOW IT WORKS ================= */}
      <div style={howItWorksSection}>
        <div style={container}>
          <h2 style={sectionTitle}>How It Works</h2>
          <div style={stepsGrid}>
            <div style={stepCard}>
              <div style={stepNumber}>1</div>
              <h3 style={stepTitle}>Connect Your Data</h3>
              <p style={stepText}>
                Securely link your brokerage accounts or import your portfolio data.
              </p>
            </div>

            <div style={stepCard}>
              <div style={stepNumber}>2</div>
              <h3 style={stepTitle}>AI Analysis</h3>
              <p style={stepText}>
                Our AI processes market data, news, and your portfolio to generate insights.
              </p>
            </div>

            <div style={stepCard}>
              <div style={stepNumber}>3</div>
              <h3 style={stepTitle}>Get Recommendations</h3>
              <p style={stepText}>
                Receive personalized investment recommendations and market alerts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= CTA SECTION ================= */}
      <div style={ctaSection}>
        <div style={container}>
          <h2 style={ctaTitle}>Ready to Transform Your Investing?</h2>
          <p style={ctaText}>
            Join thousands of investors who are already using Stock.io to make smarter decisions.
          </p>
          <a href="/login" style={ctaButton} className="cta-button">Get Started Today</a>
        </div>
      </div>

    </div>
  );
}

/* ================= STYLES ================= */

const navStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "25px 6%",
  backgroundColor: "rgba(2, 6, 23, 0.9)",
  backdropFilter: "blur(10px)",
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
};

const logoStyle = {
  fontSize: "24px",
  fontWeight: "bold",
};

const navLinks = {
  display: "flex",
  gap: "30px",
  fontSize: "14px",
  color: "white",
};

const loginBtn = {
  backgroundColor: "transparent",
  border: "1px solid #00ffae",
  color: "#00ffae",
  padding: "8px 18px",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer",
};

const pageStyle = {
  minHeight: "100vh",
  color: "white",
  fontFamily: "sans-serif",
  background: `
    radial-gradient(circle at 20% 30%, rgba(0,255,174,0.08), transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(0,255,174,0.06), transparent 40%),
    linear-gradient(135deg, #020617 0%, #0a0f1f 40%, #020617 100%)
  `,
};

const heroSection = {
  padding: "120px 6% 80px",
  textAlign: "center",
  backgroundImage: "linear-gradient(rgba(2, 6, 23, 0.85), rgba(2, 6, 23, 0.85)), url('/landing-page.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
  position: "relative",
};

const heroContent = {
  maxWidth: "800px",
  margin: "0 auto",
};

const heroTitle = {
  fontSize: "48px",
  fontWeight: "bold",
  marginBottom: "30px",
  lineHeight: "1.2",
};

const highlight = {
  color: "#00ffae",
};

const heroText = {
  fontSize: "20px",
  color: "#94a3b8",
  lineHeight: "1.6",
  maxWidth: "600px",
  margin: "0 auto",
};

const missionSection = {
  padding: "80px 6%",
  background: "linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(51, 65, 85, 0.2))",
  backdropFilter: "blur(20px)",
  borderTop: "1px solid rgba(0, 255, 174, 0.1)",
  borderBottom: "1px solid rgba(0, 255, 174, 0.1)",
};

const container = {
  maxWidth: "1200px",
  margin: "0 auto",
};

const sectionTitle = {
  fontSize: "36px",
  fontWeight: "bold",
  textAlign: "center",
  marginBottom: "50px",
};

const missionText = {
  fontSize: "18px",
  color: "#94a3b8",
  lineHeight: "1.7",
  textAlign: "center",
  maxWidth: "800px",
  margin: "0 auto",
};

const featuresSection = {
  padding: "80px 6%",
};

const featuresGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
  gap: "40px",
  marginTop: "60px",
};

const featureCard = {
  background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.4))",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(0, 255, 174, 0.1)",
  padding: "40px 30px",
  borderRadius: "20px",
  textAlign: "center",
  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  boxShadow: "0 8px 32px rgba(0, 255, 174, 0.1), 0 2px 8px rgba(0, 0, 0, 0.2)",
  position: "relative",
  overflow: "hidden",
};

const featureCardHover = `
  .feature-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 255, 174, 0.15), 0 8px 16px rgba(0, 0, 0, 0.3);
    border-color: rgba(0, 255, 174, 0.3);
  }
`;

const featureIcon = {
  fontSize: "48px",
  marginBottom: "20px",
};

const featureTitle = {
  fontSize: "24px",
  fontWeight: "bold",
  marginBottom: "15px",
};

const featureText = {
  color: "#94a3b8",
  lineHeight: "1.6",
};

const howItWorksSection = {
  padding: "80px 6%",
  background: "linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(51, 65, 85, 0.2))",
  backdropFilter: "blur(20px)",
  borderTop: "1px solid rgba(0, 255, 174, 0.1)",
  borderBottom: "1px solid rgba(0, 255, 174, 0.1)",
};

const stepsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "40px",
  marginTop: "60px",
};

const stepCard = {
  background: "linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(51, 65, 85, 0.3))",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(0, 255, 174, 0.08)",
  textAlign: "center",
  padding: "40px 20px",
  borderRadius: "20px",
  boxShadow: "0 4px 16px rgba(0, 255, 174, 0.08), 0 2px 8px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s ease",
};

const stepNumber = {
  width: "60px",
  height: "60px",
  backgroundColor: "#00ffae",
  color: "#0f172a",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 auto 20px",
};

const stepTitle = {
  fontSize: "24px",
  fontWeight: "bold",
  marginBottom: "15px",
};

const stepText = {
  color: "#94a3b8",
  lineHeight: "1.6",
};

const ctaSection = {
  padding: "80px 6%",
  textAlign: "center",
};

const ctaTitle = {
  fontSize: "36px",
  fontWeight: "bold",
  marginBottom: "20px",
};

const ctaText = {
  fontSize: "18px",
  color: "#94a3b8",
  marginBottom: "40px",
  maxWidth: "600px",
  margin: "0 auto 40px",
};

const ctaButton = {
  background: "linear-gradient(135deg, #00ffae 0%, #00d4aa 100%)",
  color: "#0f172a",
  padding: "16px 40px",
  borderRadius: "12px",
  fontSize: "18px",
  fontWeight: "bold",
  textDecoration: "none",
  display: "inline-block",
  boxShadow: "0 10px 25px rgba(0,255,174,0.3), 0 4px 12px rgba(0,0,0,0.2)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  border: "none",
  position: "relative",
  overflow: "hidden",
};