"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = (e) => {
    e.preventDefault();

    // Save user locally (temporary demo auth)
    localStorage.setItem("user", JSON.stringify({ email }));

    // Redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <div style={container}>
      <form onSubmit={handleSignup} style={formStyle}>
        <h2>Create Account</h2>

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
    </div>
  );
}

/* STYLES */

const container = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  background: "#0f172a",
  color: "white",
};

const formStyle = {
  background: "#1e293b",
  padding: "40px",
  borderRadius: "10px",
  width: "350px",
  display: "flex",
  flexDirection: "column",
};

const inputStyle = {
  marginTop: "15px",
  padding: "10px",
  borderRadius: "5px",
  border: "none",
};

const buttonStyle = {
  marginTop: "20px",
  padding: "10px",
  borderRadius: "5px",
  border: "none",
  backgroundColor: "#00ffae",
  fontWeight: "bold",
  cursor: "pointer",
}; 