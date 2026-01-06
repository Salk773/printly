"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    // Check if we have a valid session (from password reset link)
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setValidSession(!!session);
    };
    checkSession();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success("Password reset successfully! Redirecting...");
      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error(error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!validSession) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#0a0f1f",
          color: "#e5e7eb",
          padding: "40px 20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            background: "#0f172a",
            border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: 20,
            padding: 32,
            textAlign: "center",
          }}
        >
          <p style={{ color: "#9ca3af", marginBottom: 20 }}>
            Invalid or expired password reset link. Please request a new one.
          </p>
          <Link
            href="/auth/forgot-password"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #c084fc, #a855f7)",
              color: "#020617",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Request New Link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0f1f",
        color: "#e5e7eb",
        padding: "40px 20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          background: "#0f172a",
          border: "1px solid rgba(148,163,184,0.2)",
          borderRadius: 20,
          padding: 32,
        }}
      >
        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: 700,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Reset Password
        </h1>
        <p
          style={{
            color: "#9ca3af",
            fontSize: "0.9rem",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          Enter your new password below.
        </p>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ fontSize: "0.85rem" }}>
            New Password (min 6 characters)
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                marginTop: 4,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(148,163,184,0.3)",
                background: "#020617",
                color: "white",
              }}
            />
          </label>

          <label style={{ fontSize: "0.85rem" }}>
            Confirm Password
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                marginTop: 4,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(148,163,184,0.3)",
                background: "#020617",
                color: "white",
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              padding: "10px 16px",
              borderRadius: 999,
              border: "none",
              cursor: loading ? "wait" : "pointer",
              fontSize: "0.95rem",
              fontWeight: 600,
              background: loading
                ? "rgba(192,132,252,0.5)"
                : "linear-gradient(135deg, #c084fc, #a855f7)",
              color: "#020617",
              boxShadow: "0 10px 28px rgba(192,132,252,0.35)",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p
          style={{
            marginTop: 20,
            textAlign: "center",
            fontSize: "0.85rem",
            color: "#9ca3af",
          }}
        >
          <Link
            href="/auth/login"
            style={{ color: "#c084fc", textDecoration: "none" }}
          >
            Back to Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}

