"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "#0a0f1f",
        color: "#e5e7eb",
      }}
    >
      <div
        style={{
          maxWidth: 500,
          width: "100%",
          textAlign: "center",
          background: "#0f172a",
          border: "1px solid rgba(148,163,184,0.2)",
          borderRadius: 20,
          padding: 30,
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: 10 }}>⚠️</div>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          Something went wrong
        </h1>
        <p style={{ color: "#9ca3af", marginBottom: 20 }}>
          {error.message || "We encountered an unexpected error. Please try again."}
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
          }}
        >
          <button
            onClick={reset}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: "none",
              background: "linear-gradient(135deg, #c084fc, #a855f7)",
              color: "#020617",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.25)",
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
    </div>
  );
}

