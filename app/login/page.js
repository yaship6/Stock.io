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
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "sans-serif",
  background: `
    radial-gradient(circle at 20% 30%, rgba(0,255,174,0.08), transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(0,255,174,0.06), transparent 40%),
    linear-gradient(135deg, #020617 0%, #0a0f1f 40%, #020617 100%)
  `,
};

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