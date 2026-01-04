"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for monitoring
    console.error("Next.js error:", error);
    
    // Show user-friendly error message
    toast.error("An error occurred. Please try again.");
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center",
        background: "#0a0f1f",
        color: "white",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "16px", color: "#f97373" }}>
        Something went wrong!
      </h1>
      <p style={{ color: "#94a3b8", marginBottom: "24px", maxWidth: "500px" }}>
        We encountered an unexpected error. Please try again or contact support if the problem persists.
      </p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            padding: "12px 24px",
            borderRadius: "8px",
            border: "none",
            background: "linear-gradient(135deg, #c084fc, #a855f7)",
            color: "#020617",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          style={{
            padding: "12px 24px",
            borderRadius: "8px",
            border: "1px solid rgba(148,163,184,0.3)",
            background: "transparent",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

