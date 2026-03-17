"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function Signup() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = (e) => {
    e.preventDefault();

    // store user in localStorage
    localStorage.setItem(
      "user",
      JSON.stringify({ name, email })
    );

    router.push("/dashboard");
  };

  return (
    <div style={pageStyle}>
      <div style={overlay}></div>
      <div style={card}>
        <h2 style={title}>Create Account</h2>

        <form onSubmit={handleSignup} style={formStyle}>
          <input
            type="text"
            placeholder="Name"
            required
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email"
            required
            style={inputStyle}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            required
            style={inputStyle}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" style={buttonStyle}>
            Sign Up
          </button>
        </form>

        <p style={footerText}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#00ffae" }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

const pageStyle = {
  height: "100vh",
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "sans-serif",
  display: "grid",
  placeItems: "center",
  top: 0,
  left: 0,
  overflow: "hidden",   
  boxSizing: "border-box",  

  backgroundImage: `
    linear-gradient(rgba(2,6,23,0.5), rgba(2,6,23,0.6)),
    url('/landing-page.jpg')
  `,
backgroundSize: "cover",
backgroundPosition: "center",   
backgroundRepeat: "no-repeat",
backgroundAttachment: "fixed",};

const card = {
  background: "rgba(30, 41, 59, 0.7)",
  backdropFilter: "blur(10px)",
  padding: "45px",
  borderRadius: "20px",
  width: "380px",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.05)",

  position: "fixed",
  zIndex: 1,            
};

const title = {
  textAlign: "center",
  marginBottom: "25px",
  fontSize: "24px",
  fontWeight: "600",
  color: "white",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
};

const inputStyle = {
  marginTop: "15px",
  padding: "14px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.08)",
  backgroundColor: "#0f172a",
  color: "white",
  fontSize: "14px",
  outline: "none",
};

const buttonStyle = {
  marginTop: "25px",
  padding: "14px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #00ffae, #00c896)",
  color: "#0f172a",
  fontWeight: "bold",
  fontSize: "15px",
  cursor: "pointer",
  boxShadow: "0 10px 25px rgba(0,255,174,0.3)",
};

const footerText = {
  marginTop: "20px",
  fontSize: "14px",
  color: "#94a3b8",
  textAlign: "center",
};

const overlay = {
  position: "fixed",
  inset: 0,
  backdropFilter: "blur(6px)",
  backgroundColor: "rgba(0,0,0,0.25)",
  zIndex: 0,
};