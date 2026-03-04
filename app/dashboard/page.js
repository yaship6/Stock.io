"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  const logout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  if (!user) return null;

  const stocks = [
    { name: "MRF.NS", company: "MRF Limited", price: "1,46,390", change: "green" },
    { name: "TATASTEEL.NS", company: "Tata Steel Limited", price: "208.36", change: "green" },
    { name: "^BSESN", company: "S&P BSE SENSEX", price: "82,814.71", change: "green" },
    { name: "^NSEI", company: "NIFTY 50", price: "25,571.25", change: "green" },
    { name: "LUPIN.NS", company: "Lupin Limited", price: "2,219.40", change: "red" },
    { name: "PNB.BO", company: "Punjab National Bank", price: "129.65", change: "green" },
  ];

  return (
    <div style={container}>
      
      {/* LEFT SIDE - NEWS */}
      <div style={newsSection}>
        <h1 style={newsMainTitle}>Stocks</h1>
        <p style={newsDate}>26 February</p>

        <div style={divider} />

        <div style={article}>
          <p style={source}>Business Today</p>
          <h3 style={headline}>
            Tata Steel, Infosys, HDFC Bank: How to trade these buzzing stocks
          </h3>
          <p style={summary}>
            Indian benchmark indices kicked-off the week on a positive note...
          </p>
          <p style={time}>2d ago</p>
        </div>

        <div style={article}>
          <p style={source}>The Economic Times</p>
          <h3 style={headline}>
            Tata Steel's Rs 3,200-crore Ludhiana plant to begin operations
          </h3>
          <p style={summary}>
            Punjab Chief Minister Bhagwant Singh Mann announced...
          </p>
          <p style={time}>2d ago</p>
        </div>
      </div>

      {/* RIGHT SIDE - STOCKS */}
      <div style={stockSection}>
        
        <div style={header}>
          <h2>
            Welcome!{" "}
            <span style={{ color: "#00ffae" }}>
              {user.email}
            </span>
          </h2>

          <button onClick={logout} style={logoutBtn}>
            Logout
          </button>
        </div>

        {stocks.map((stock, index) => (
          <div key={index} style={stockCard}>
            <div>
              <h3>{stock.name}</h3>
              <p style={{ color: "#94a3b8" }}>{stock.company}</p>
            </div>

            <div style={{ textAlign: "right" }}>
              <h3>{stock.price}</h3>
              <div
                style={{
                  ...changeBadge,
                  backgroundColor:
                    stock.change === "green" ? "#16a34a" : "#dc2626",
                }}
              >
                {stock.change === "green" ? "▲ Up" : "▼ Down"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const container = {
  display: "flex",
  minHeight: "100vh",
  color: "white",
  fontFamily: "sans-serif",
  background: `
    radial-gradient(circle at 20% 30%, rgba(0,255,174,0.08), transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(0,255,174,0.06), transparent 40%),
    linear-gradient(135deg, #020617 0%, #0a0f1f 40%, #020617 100%)
  `,
};

const newsSection = {
  width: "30%",
  padding: "40px",
  margin: "30px",
  border: "1px solid rgba(255,255,255,0.15)", // soft white outline
  borderRadius: "20px",
  background: "rgba(255,255,255,0.02)", // subtle glass feel
  backdropFilter: "blur(10px)",
  boxShadow: "0 0 40px rgba(255,255,255,0.05)",
};

const stockSection = {
  width: "70%",
  padding: "50px",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "40px",
};

const logoutBtn = {
  background: "linear-gradient(135deg, #ef4444, #dc2626)",
  color: "white",
  border: "none",
  padding: "12px 22px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "600",
  boxShadow: "0 10px 25px rgba(239,68,68,0.3)",
  transition: "0.3s ease",
};

const stockCard = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "rgba(30, 41, 59, 0.6)",
  backdropFilter: "blur(12px)",
  padding: "25px",
  borderRadius: "18px",
  marginBottom: "20px",
  border: "1px solid rgba(255,255,255,0.05)",
};

const changeBadge = {
  marginTop: "8px",
  padding: "6px 14px",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: "bold",
};

const newsMainTitle = {
  fontSize: "32px",
  fontWeight: "700",
};

const newsDate = {
  fontSize: "18px",
  color: "#94a3b8",
};

const divider = {
  height: "1px",
  background: "rgba(255,255,255,0.2)",
  margin: "25px 0",
};

const article = {
  marginBottom: "30px",
};

const source = {
  fontSize: "13px",
  color: "#94a3b8",
  marginBottom: "6px",
};

const headline = {
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "1.4",
  marginBottom: "6px",
};

const summary = {
  fontSize: "14px",
  color: "#94a3b8",
  lineHeight: "1.5",
};

const time = {
  fontSize: "12px",
  color: "#64748b",
  marginTop: "6px",
};