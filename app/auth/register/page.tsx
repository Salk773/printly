"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import toast from "react-hot-toast";
import { validateAuthForm } from "@/lib/validation";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Validate form
    const validation = validateAuthForm({ email, password });
    if (!validation.isValid) {
      validation.errors.forEach((error) => toast.error(error));
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    const { error } = await signUp(email, password);

    if (error) {
      setErrorMsg(error);
      toast.error(error);
      setLoading(false);
      return;
    }

    setInfoMsg("Account created. You can now log in.");
    toast.success("Account created successfully!");
    setLoading(false);
    router.push("/auth/login");
  };

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
        }}
      >
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          Create an account
        </h1>
        <p
          style={{
            fontSize: "0.9rem",
            color: "#94a3b8",
            marginBottom: 18,
          }}
        >
          Save your cart, track orders and manage your wishlist.
        </p>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ fontSize: "0.85rem" }}>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={{ fontSize: "0.85rem" }}>
            Password (min 6 chars)
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </label>

          {errorMsg && (
            <p
              style={{
                color: "#f97373",
                fontSize: "0.8rem",
              }}
            >
              {errorMsg}
            </p>
          )}

          {infoMsg && (
            <p
              style={{
                color: "#4ade80",
                fontSize: "0.8rem",
              }}
            >
              {infoMsg}
            </p>
          )}

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
              background: "linear-gradient(135deg, #c084fc, #a855f7)",
              color: "#020617",
              boxShadow: "0 10px 28px rgba(192,132,252,0.35)",
              opacity: loading ? 0.8 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p
          style={{
            marginTop: 16,
            fontSize: "0.8rem",
            color: "#64748b",
          }}
        >
          Already have an account?{" "}
          <a
            href="/auth/login"
            style={{ color: "#c084fc", textDecoration: "none", fontWeight: 500 }}
          >
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 4,
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(148,163,184,0.4)",
  background: "rgba(15,23,42,0.8)",
  color: "white",
  fontSize: "0.85rem",
  outline: "none",
};
