"use client";

import { useCart } from "@/context/CartProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from "@/lib/email";
import { validateCheckoutForm, sanitizeInput } from "@/lib/validation";

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  // Contact
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Address
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const hasItems = items.length > 0;

  // Redirect if cart empty (but not if order was just placed)
  useEffect(() => {
    if (!hasItems && !orderPlaced) {
      router.push("/cart");
    }
  }, [hasItems, orderPlaced, router]);

  // SINGLE order submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasItems || loading) return;

    // Validate form data
    const validation = validateCheckoutForm({
      email: user ? undefined : email,
      name: user ? undefined : name,
      phone,
      address1,
      city,
      state,
      postalCode,
      isGuest: !user, // Pass guest status to validation
    });

    if (!validation.isValid) {
      validation.errors.forEach((error) => toast.error(error));
      return;
    }

    setLoading(true);

    const orderPayload = {
      user_id: user?.id ?? null,
      guest_name: user ? null : sanitizeInput(name || ""),
      guest_email: user ? null : sanitizeInput(email),

      phone: sanitizeInput(phone),
      address_line_1: sanitizeInput(address1),
      address_line_2: address2 ? sanitizeInput(address2) : null,
      city: sanitizeInput(city),
      state: sanitizeInput(state),
      postal_code: postalCode ? sanitizeInput(postalCode) : null,

      items: items.map((i) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      total,
      status: "pending",
      notes: notes ? sanitizeInput(notes) : null,
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("id, order_number")
      .single();

    if (error || !data) {
      console.error(error);
      setLoading(false);
      toast.error("Failed to place order. Please try again.");
      return;
    }

    // Mark order as placed before clearing cart to prevent redirect
    setOrderPlaced(true);
    clearCart();
    setLoading(false);

    // Send email notifications (non-blocking)
    const customerEmail = user?.email || email;
    const customerName = user ? (user.user_metadata?.full_name || user.email?.split("@")[0]) : name;

    const emailData = {
      orderId: data.id,
      orderNumber: data.order_number,
      customerEmail,
      customerName,
      phone,
      address: {
        line1: address1,
        line2: address2,
        city,
        state,
        postalCode,
      },
      items: items.map((i) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      total,
      notes,
    };

    // Send emails in background (don't block redirect)
    Promise.all([
      sendOrderConfirmationEmail(emailData).catch((err) => {
        console.error("Failed to send customer email:", err);
      }),
      sendAdminOrderNotification(emailData).catch((err) => {
        console.error("Failed to send admin email:", err);
      }),
    ]);

    // ✅ Redirect to existing success page
    router.push(
      `/checkout/success?order=${encodeURIComponent(data.id)}&number=${encodeURIComponent(data.order_number)}`
    );
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
          <form onSubmit={handleSubmit} style={formStyle}>
            <h2 style={{ fontSize: "1.1rem" }}>Contact & delivery</h2>

            {!user && (
              <>
                <Input label="Name" value={name} onChange={setName} />
                <Input
                  label="Email"
                  value={email}
                  onChange={setEmail}
                  type="email"
                />
              </>
            )}

            <Input label="Phone" value={phone} onChange={setPhone} />
            <Input label="Address line 1" value={address1} onChange={setAddress1} />
            <Input
              label="Address line 2 (optional)"
              value={address2}
              onChange={setAddress2}
            />
            <Input label="City" value={city} onChange={setCity} />
            <Input label="State / Emirate" value={state} onChange={setState} />
            <Input
              label="Postal code (optional)"
              value={postalCode}
              onChange={setPostalCode}
            />

            <label style={{ fontSize: "0.85rem", color: "#cbd5f5" }}>
              Notes / requirements
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={textareaStyle}
              />
            </label>

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? "Placing order..." : "Place order"}
            </button>

            <Link href="/cart" style={{ fontSize: "0.85rem", color: "#93c5fd" }}>
              ← Back to cart
            </Link>
          </form>

          {/* SUMMARY */}
          <aside style={summaryStyle}>
            <h2 style={{ fontSize: "1.1rem" }}>Order summary</h2>

            {items.map((item) => (
              <div
                key={item.id}
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>
                  {(item.price * item.quantity).toFixed(2)} AED
                </span>
              </div>
            ))}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
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

/* ---------- helpers ---------- */

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label style={{ fontSize: "0.85rem", color: "#cbd5f5" }}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={!label.includes("optional")}
        style={inputStyle}
      />
    </label>
  );
}

const formStyle = {
  borderRadius: 20,
  background: "#0f172a",
  border: "1px solid rgba(148,163,184,0.2)",
  padding: 20,
  display: "flex",
  flexDirection: "column" as const,
  gap: 14,
  boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
};

const inputStyle = {
  marginTop: 4,
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(148,163,184,0.3)",
  background: "#020617",
  color: "white",
};

const textareaStyle = {
  marginTop: 4,
  width: "100%",
  minHeight: 90,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(148,163,184,0.3)",
  background: "#020617",
  color: "white",
};

const buttonStyle = {
  marginTop: 12,
  padding: "12px 18px",
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg, #c084fc, #a855f7)",
  color: "#020617",
  fontWeight: 700,
  cursor: "pointer",
};

const summaryStyle = {
  borderRadius: 20,
  background: "#0f172a",
  border: "1px solid rgba(148,163,184,0.2)",
  padding: 18,
  display: "flex",
  flexDirection: "column" as const,
  gap: 12,
};
