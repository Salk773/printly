"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import toast from "react-hot-toast";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      const type = searchParams.get("type");

      if (!token || type !== "email") {
        setStatus("error");
        setMessage("Invalid verification link.");
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "email",
        });

        if (error) {
          setStatus("error");
          setMessage(error.message || "Failed to verify email. The link may have expired.");
          toast.error("Verification failed");
          return;
        }

        setStatus("success");
        setMessage("Email verified successfully! You can now sign in.");
        toast.success("Email verified!");
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "An error occurred during verification.");
        toast.error("Verification failed");
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "radial-gradient(circle at top, #020617 0, #020617 40%, #020617 100%)",
        color: "white",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 18,
          border: "1px solid rgba(148,163,184,0.35)",
          background: "rgba(15,23,42,0.9)",
          boxShadow: "0 20px 45px rgba(15,23,42,0.7)",
          padding: 24,
          textAlign: "center",
        }}
      >
        {status === "verifying" && (
          <>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>⏳</div>
            <h1
              style={{
                fontSize: "1.6rem",
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              Verifying Email
            </h1>
            <p style={{ color: "#94a3b8", marginBottom: 20 }}>{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>✅</div>
            <h1
              style={{
                fontSize: "1.6rem",
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              Email Verified!
            </h1>
            <p style={{ color: "#94a3b8", marginBottom: 20 }}>{message}</p>
            <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
              Redirecting to login...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>❌</div>
            <h1
              style={{
                fontSize: "1.6rem",
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              Verification Failed
            </h1>
            <p style={{ color: "#f97373", marginBottom: 20 }}>{message}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Link
                href="/auth/login"
                style={{
                  padding: "10px 16px",
                  borderRadius: 999,
                  border: "none",
                  background: "linear-gradient(135deg, #c084fc, #a855f7)",
                  color: "#020617",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Go to Login
              </Link>
              <Link
                href="/auth/register"
                style={{
                  padding: "10px 16px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "transparent",
                  color: "white",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Create New Account
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

