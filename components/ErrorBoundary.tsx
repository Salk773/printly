"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import toast from "react-hot-toast";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch React errors
 */
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
    
    // Show user-friendly error message
    toast.error("Something went wrong. Please refresh the page.");
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error state when children change
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: "400px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", marginBottom: "16px", color: "#f97373" }}>
            Something went wrong
          </h2>
          <p style={{ color: "#94a3b8", marginBottom: "24px", maxWidth: "500px" }}>
            We encountered an unexpected error. Please try refreshing the page.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(135deg, #c084fc, #a855f7)",
              color: "#020617",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details style={{ marginTop: "24px", textAlign: "left", maxWidth: "600px" }}>
              <summary style={{ cursor: "pointer", color: "#94a3b8", marginBottom: "8px" }}>
                Error Details (Development Only)
              </summary>
              <pre
                style={{
                  background: "#0f172a",
                  padding: "16px",
                  borderRadius: "8px",
                  overflow: "auto",
                  fontSize: "0.85rem",
                  color: "#f97373",
                }}
              >
                {this.state.error.toString()}
                {this.state.error.stack && `\n\n${this.state.error.stack}`}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

