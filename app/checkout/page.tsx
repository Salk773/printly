"use client";

import { useCart } from "@/context/CartProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
const [address1, setAddress1] = useState("");
const [address2, setAddress2] = useState("");
const [city, setCity] = useState("");
const [state, setState] = useState("");
const [postalCode, setPostalCode] = useState("");


  const hasItems = items.length > 0;

  // Redirect if cart empty
  useEffect(() => {
    if (!hasItems) {
      router.push("/cart");
    }
  }, [hasItems, router]);

  // SINGLE order submit handler (correct)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasItems) return;

    if (!user && !email) {
      alert("Email is required");
      return;
    }

    setLoading(true);

    const orderPayload = {
      user_id: user?.id ?? null,
      guest_name: user ? null : name || null,
      guest_email: user ? null : email,
      items: items.map((i) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      total,
      status: "pending",
      notes,
    };

    const { data, error } = await supabase
      .from("orders")
      .insert([orderPayload])
      .select("id")
      .single();

    if (error) {
      console.error(error);
      alert("Failed to place order. Please try again.");
      setLoading(false);
      return;
    }

    clearCart();
    router.push(`/checkout/success?order=${data.id}`);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0f1f",
        color: "#e5e7eb",
        padding: "40px 20px 60px",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: 10, fontWeight: 700 }}>
          Checkout
        </h1>

        <p style={{ color: "#9ca3af", marginBottom: 30 }}>
          Complete your order below. No payment is required yet.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(260px, 1fr)",
            gap: 30,
          }}
        >
          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            style={{
              borderRadius: 20,
              background: "#0f172a",
              border: "1px solid rgba(148,163,184,0.2)",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", marginBottom: 4 }}>
              Contact details
            </h2>

    {!user && (
  <>
    <label style={{ fontSize: "0.85rem", color: "#cbd5f5" }}>
      Name
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
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

    <label style={{ fontSize: "0.85rem", color: "#cbd5f5" }}>
      Email
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
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
  </>
)}


            <label style={{ fontSize: "0.85rem", color: "#cbd5f5" }}>
              Notes / requirements
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  marginTop: 4,
                  width: "100%",
                  minHeight: 90,
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
                marginTop: 12,
                padding: "12px 18px",
                borderRadius: 999,
                border: "none",
                background:
                  "linear-gradient(135deg, #c084fc, #a855f7)",
                color: "#020617",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.95rem",
                boxShadow: "0 10px 28px rgba(192,132,252,0.35)",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Placing order..." : "Place order"}
            </button>

            <Link
              href="/cart"
              style={{
                marginTop: 6,
                fontSize: "0.85rem",
                color: "#93c5fd",
                textDecoration: "none",
              }}
            >
              ← Back to cart
            </Link>
          </form>

          {/* SUMMARY */}
          <aside
            style={{
              borderRadius: 20,
              background: "#0f172a",
              border: "1px solid rgba(148,163,184,0.2)",
              padding: 18,
              boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <h2 style={{ fontSize: "1.1rem", marginBottom: 4 }}>
              Order summary
            </h2>

            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.9rem",
                    marginBottom: 6,
                  }}
                >
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>
                    {(item.price * item.quantity).toFixed(2)} AED
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 10,
                fontWeight: 700,
              }}
            >
              <span>Total</span>
              <span>{total.toFixed(2)} AED</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
