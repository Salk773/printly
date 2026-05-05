"use client";

import type { CSSProperties } from "react";
import type { Order } from "@/app/admin/page";
import {
  formatItemLines,
  orderIdentifier,
  shipToLines,
} from "@/lib/shippingLabel";

export default function ShippingLabelPrint({
  order,
  labelWidthIn,
}: {
  order: Order;
  labelWidthIn: number;
}) {
  const w = Math.min(Math.max(labelWidthIn, 2), 4);
  const ship = shipToLines(order).slice(0, 6);
  const items = formatItemLines(order).slice(0, 9);
  const notes = order.notes?.trim() ?? "";
  const created = new Date(order.created_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const shippingExtra =
    typeof order.shipping_cost === "number" && !Number.isNaN(order.shipping_cost)
      ? order.shipping_cost
      : null;

  const rootStyle: CSSProperties = {
    ["--labelWidth" as string]: `${w}in`,
    width: "var(--labelWidth)",
    maxWidth: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
    padding: "10px 12px",
    background: "#fff",
    color: "#111",
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
    fontSize: 11,
    lineHeight: 1.28,
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.12)",
  };

  return (
    <div className="shipping-label-root" style={rootStyle}>
      <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 4 }}>
        PRINTLY
      </div>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>
        {orderIdentifier(order)}
      </div>
      <div style={{ fontSize: 9, color: "#444", marginBottom: 8 }}>
        {created}
      </div>

      <div style={{ fontWeight: 700, marginBottom: 3 }}>SHIP TO</div>
      <div style={{ marginBottom: 8 }}>
        {ship.length === 0 ? (
          <span style={{ color: "#666" }}>(No address on file)</span>
        ) : (
          ship.map((line, i) => (
            <div key={i}>{line}</div>
          ))
        )}
      </div>

      <div style={{ fontWeight: 700, marginBottom: 3 }}>ITEMS</div>
      <div style={{ marginBottom: 8 }}>
        {items.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      {notes ? (
        <>
          <div style={{ fontWeight: 700, marginBottom: 3 }}>NOTES</div>
          <div style={{ marginBottom: 8, whiteSpace: "pre-wrap" }}>
            {notes.slice(0, 220)}
          </div>
        </>
      ) : null}

      <div
        style={{
          borderTop: "1px solid #ddd",
          paddingTop: 6,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontWeight: 700 }}>
          Total{" "}
          {Number.isFinite(order.total) ? order.total.toFixed(2) : "0.00"} AED
        </span>
        {shippingExtra != null ? (
          <span style={{ fontSize: 10 }}>Ship {shippingExtra.toFixed(2)} AED</span>
        ) : null}
      </div>

      <div style={{ fontSize: 9, color: "#888", marginTop: 8 }}>
        Status: {order.status}
      </div>
    </div>
  );
}
