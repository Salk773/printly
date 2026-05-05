"use client";

import { useState } from "react";
import { Order } from "@/app/admin/page";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import {
  stripePaymentDashboardUrl,
  stripeCheckoutSessionDashboardUrl,
} from "@/lib/stripeDashboard";

export default function OrderDetailsModal({
  order,
  onClose,
  onOrderUpdated,
}: {
  order: Order;
  onClose: () => void;
  onOrderUpdated?: () => void;
}) {
  const [refundPart, setRefundPart] = useState("");
  const [refunding, setRefunding] = useState(false);

  const pi = order.stripe_payment_intent_id;
  const cs = order.stripe_checkout_session_id;
  const payUrl = pi ? stripePaymentDashboardUrl(pi) : null;
  const sessionUrl = cs ? stripeCheckoutSessionDashboardUrl(cs) : null;

  const runRefund = async (full: boolean) => {
    if (!pi) {
      toast.error("No Stripe payment on this order.");
      return;
    }
    if (order.status === "refunded") {
      toast.error("Order is already marked refunded.");
      return;
    }
    let amountAed: number | undefined;
    if (!full) {
      const n = parseFloat(refundPart.replace(/,/g, "."));
      if (!Number.isFinite(n) || n <= 0) {
        toast.error("Enter a valid partial amount in AED.");
        return;
      }
      if (n > order.total + 0.01) {
        toast.error("Refund cannot exceed order total.");
        return;
      }
      amountAed = n;
    }

    if (!full && !confirm(`Refund ${amountAed!.toFixed(2)} AED to the customer card?`)) return;
    if (full && !confirm("Refund the full payment to the customer card?")) return;

    setRefunding(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        toast.error("Not signed in");
        return;
      }
      const res = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(full ? {} : { amountAed }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Refund failed");
      toast.success("Refund created. Order marked refunded.");
      onOrderUpdated?.();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Refund failed");
    } finally {
      setRefunding(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        className="card-soft"
        style={{ maxWidth: 520, width: "100%", padding: 20, maxHeight: "90vh", overflow: "auto" }}
      >
        <h3 style={{ marginBottom: 12 }}>Order Details</h3>

        <p>
          <strong>Order #:</strong> {order.order_number ?? order.id.slice(0, 8)}
        </p>

        <p>
          <strong>Customer:</strong> {order.guest_name || "Guest"}{" "}
          {order.guest_email && `(${order.guest_email})`}
        </p>

        {order.phone && (
          <p>
            <strong>Phone:</strong> {order.phone}
          </p>
        )}

        {order.saved_address_id && (
          <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
            Delivery details linked to a saved account address at checkout.
          </p>
        )}

        <p>
          <strong>Address:</strong>
          <br />
          {order.address_line_1}
          {order.address_line_2 && (
            <>
              <br />
              {order.address_line_2}
            </>
          )}
          <br />
          {order.city}, {order.state} {order.postal_code}
        </p>

        <div
          style={{
            marginTop: 12,
            marginBottom: 8,
            padding: 10,
            borderRadius: 10,
            background: "rgba(59, 130, 246, 0.08)",
            border: "1px solid rgba(59, 130, 246, 0.25)",
          }}
        >
          <strong>Fulfillment status</strong>
          <p style={{ margin: "6px 0 0", fontSize: 14 }}>{order.status}</p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>
            This is your packing/shipping workflow (paid → processing → completed). It is separate from card
            refunds below.
          </p>
        </div>

        {(payUrl || sessionUrl) && (
          <div
            style={{
              marginBottom: 12,
              padding: 10,
              borderRadius: 10,
              background: "rgba(148, 163, 184, 0.08)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
            }}
          >
            <strong>Payment (Stripe)</strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {payUrl && (
                <a href={payUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: 13 }}>
                  Open payment in Stripe
                </a>
              )}
              {sessionUrl && (
                <a
                  href={sessionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                  style={{ fontSize: 13 }}
                >
                  Open checkout session
                </a>
              )}
            </div>
            {pi && (
              <p style={{ fontSize: 11, color: "#64748b", marginTop: 8, wordBreak: "break-all" }}>
                {pi}
              </p>
            )}
          </div>
        )}

        <strong style={{ display: "block", marginBottom: 12 }}>Items</strong>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
          {order.items.map((i: any, idx: number) => {
            const itemImage = i.image || "/placeholder-product.png";
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  padding: 12,
                  background: "rgba(148,163,184,0.05)",
                  borderRadius: 10,
                }}
              >
                <img
                  src={itemImage}
                  alt={i.name}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    objectFit: "cover",
                    border: "1px solid rgba(148,163,184,0.15)",
                    flexShrink: 0,
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='60' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: "0.9rem" }}>{i.name}</div>
                  <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Qty: {i.quantity}</div>
                </div>
                <div style={{ fontWeight: 600, color: "#c084fc", fontSize: "0.9rem" }}>
                  {(i.price * i.quantity).toFixed(2)} AED
                </div>
              </div>
            );
          })}
        </div>

        {order.notes && (
          <p>
            <strong>Notes:</strong> {order.notes}
          </p>
        )}

        <p style={{ fontWeight: 700 }}>
          Total: {order.total.toFixed(2)} AED
          {order.shipping_cost != null && Number(order.shipping_cost) > 0 && (
            <span style={{ fontWeight: 400, fontSize: 13, color: "#94a3b8", marginLeft: 8 }}>
              (incl. shipping where applicable)
            </span>
          )}
        </p>

        {pi && order.status !== "refunded" && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 10,
              background: "rgba(239, 68, 68, 0.06)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
            }}
          >
            <strong>Refund card payment</strong>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "8px 0" }}>
              Sends money back via Stripe. Also sets fulfillment status to &quot;refunded&quot;.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                className="btn-primary"
                disabled={refunding}
                onClick={() => runRefund(true)}
              >
                {refunding ? "…" : "Full refund"}
              </button>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                placeholder="Partial AED"
                value={refundPart}
                onChange={(e) => setRefundPart(e.target.value)}
                style={{ width: 120, fontSize: 13 }}
              />
              <button
                type="button"
                className="btn-ghost"
                disabled={refunding}
                onClick={() => runRefund(false)}
              >
                Partial refund
              </button>
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="btn-primary"
            onClick={() =>
              window.open(`/admin/label/${order.id}?print=1`, "_blank", "noopener,noreferrer")
            }
          >
            Print shipping label
          </button>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
