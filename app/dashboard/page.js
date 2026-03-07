"use client";
import NewsSection from "../components/NewsSection"
import StocksSection from "../components/StocksSection"
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

  return (
    <div style={container}>
      
      <div style={newsSection}>
  <NewsSection />
</div>

      {/* RIGHT SIDE - STOCKS */}
      <div style={stockSection}>
  <StocksSection/>
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