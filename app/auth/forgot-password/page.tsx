"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error(error.message || "Failed to send password reset email");
    } finally {
      setLoading(false);
    }
  };

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
          Forgot Password?
        </h1>
        <p
          style={{
            color: "#9ca3af",
            fontSize: "0.9rem",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          Enter your email address and we'll send you a link to reset your
          password.
        </p>

        {sent ? (
          <div
            style={{
              padding: 20,
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: 12,
              marginBottom: 20,
            }}
          >
            <p style={{ color: "#22c55e", textAlign: "center" }}>
              Password reset email sent! Please check your inbox and follow the
              instructions.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ fontSize: "0.85rem" }}>
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p
          style={{
            marginTop: 20,
            textAlign: "center",
            fontSize: "0.85rem",
            color: "#9ca3af",
          }}
        >
          Remember your password?{" "}
          <Link
            href="/auth/login"
            style={{ color: "#c084fc", textDecoration: "none" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

