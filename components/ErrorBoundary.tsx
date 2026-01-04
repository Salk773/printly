"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

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
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
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
              Refresh Page
            </button>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details
                style={{
                  marginTop: 20,
                  padding: 15,
                  background: "#020617",
                  borderRadius: 10,
                  textAlign: "left",
                  fontSize: "0.8rem",
                  color: "#f87171",
                }}
              >
                <summary style={{ cursor: "pointer", marginBottom: 10 }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{ overflow: "auto", whiteSpace: "pre-wrap" }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

