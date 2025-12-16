"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function CheckoutSuccessClient() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get("order");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0f1f",
        color: "#e5e7eb",
        padding: "60px 20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          textAlign: "center",
          background: "#0f172a",
          border: "1px solid rgba(148,163,184,0.2)",
          borderRadius: 20,
          padding: 30,
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>🎉</div>

        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          Order placed successfully
        </h1>

        <p
          style={{
            color: "#9ca3af",
            fontSize: "0.95rem",
            marginBottom: 18,
          }}
        >
          Thank you for your order. We’ll contact you shortly to confirm.
        </p>

        {orderId && (
          <div
            style={{
              marginBottom: 20,
              padding: "10px 14px",
              borderRadius: 12,
              background: "rgba(192,132,252,0.12)",
              color: "#c084fc",
              fontSize: "0.85rem",
              fontWeight: 600,
              display: "inline-block",
            }}
          >
            Order ID: {orderId}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            marginTop: 20,
          }}
        >
          <button
            onClick={() => router.push("/products")}
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
            Continue shopping
          </button>

          <button
            onClick={() => router.push("/")}
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
            Home
          </button>
        </div>
      </div>
    </main>
  );
}
