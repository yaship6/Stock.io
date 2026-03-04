"use client";

import Link from "next/link";

export default function Home() {
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

      {/* Rest of your page below */}

      {/* ================= HERO SECTION ================= */}
      <div style={heroSection}>
        
        {/* LEFT SIDE */}
        <div style={leftHero}>
          <h1 style={heroTitle}>
            The <span style={highlight}>best</span> <br />
            Way to <br />
            <span style={highlight}>Invest</span> your Money
          </h1>

          <p style={heroText}>
            AI-powered insights. Real-time market data.
            Smarter investment decisions — all in one platform.
          </p>

          <div style={{ marginTop: "35px" }}>
            <Link href="/login">
              <button style={primaryBtn}>Get Started →</button>
            </Link>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div style={rightHero}>
          <img
            src="/landing-page.jpg"
            alt="Trading Dashboard"
            style={heroImage}
          />
        </div>
      </div>

      {/* ================= TOP STOCKS ================= */}
      <div style={topStocksSection}>
        <h3 style={sectionTitle}>
          🔥 Top Stocks in the Market
        </h3>

        <div style={stockCards}>
          {stockData.map((stock, index) => (
            <div key={index} style={stockCard}>
              <h4>{stock.name}</h4>
              <p style={stockPrice}>{stock.price}</p>
              <p
                style={{
                  color: stock.up ? "#00ffae" : "#ff4d4d",
                  fontWeight: "bold",
                }}
              >
                {stock.change}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

/* ================= STOCK DATA ================= */

const stockData = [
  { name: "S&P Futures", price: "3145.0", change: "+18.7 (0.57%)", up: true },
  { name: "Nasdaq", price: "11758.8", change: "+24.7 (0.28%)", up: true },
  { name: "EUR/USD", price: "1.1568", change: "-0.00045 (0.02%)", up: false },
  { name: "Bitcoin", price: "1536.08", change: "+78.24 (0.25%)", up: true },
  { name: "AUD", price: "2.4563", change: "-0.0075 (0.07%)", up: false },
];

/* ================= STYLES ================= */

const pageStyle = {
  minHeight: "100vh",
  color: "white",
  padding: "0 6%",
  fontFamily: "sans-serif",
  background: `
    radial-gradient(circle at 20% 30%, rgba(0,255,174,0.08), transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(0,255,174,0.06), transparent 40%),
    linear-gradient(135deg, #020617 0%, #0a0f1f 40%, #020617 100%)
  `,
};
const navStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "25px 0",
};

const logoStyle = {
  fontSize: "24px",
  fontWeight: "bold",
};

const navLinks = {
  display: "flex",
  gap: "30px",
  fontSize: "14px",
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

const heroSection = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "80px",
  gap: "60px",
};

const leftHero = {
  flex: 1,
};

const heroTitle = {
  fontSize: "52px",
  fontWeight: "bold",
  lineHeight: "1.2",
};

const highlight = {
  color: "#00ffae",
};

const heroText = {
  marginTop: "25px",
  color: "#94a3b8",
  fontSize: "17px",
  maxWidth: "500px",
};

const primaryBtn = {
  backgroundColor: "#00ffae",
  color: "#0f172a",
  border: "none",
  padding: "14px 30px",
  borderRadius: "10px",
  fontWeight: "bold",
  fontSize: "16px",
  cursor: "pointer",
  boxShadow: "0 10px 25px rgba(0,255,174,0.3)",
};

const rightHero = {
  flex: 1,
};

const heroImage = {
  width: "100%",
  borderRadius: "20px",
  opacity: 0.85,
};

const topStocksSection = {
  marginTop: "120px",
};

const sectionTitle = {
  marginBottom: "25px",
};

const stockCards = {
  display: "flex",
  gap: "25px",
  flexWrap: "wrap",
};

const stockCard = {
  backgroundColor: "#1e293b",
  padding: "25px",
  borderRadius: "15px",
  width: "220px",
  transition: "0.3s",
};

const stockPrice = {
  color: "#94a3b8",
  marginTop: "8px",
};