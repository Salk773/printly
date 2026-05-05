"use client";

import AdminCard from "@/components/admin/AdminCard";
import type { Product } from "@/app/admin/page";

function isLowStock(p: Product): boolean {
  const qty = p.stock_quantity;
  if (qty == null) return false;
  const threshold = p.low_stock_threshold ?? 5;
  return qty <= threshold;
}

export default function AdminInventory({
  products,
  onEditProduct,
}: {
  products: Product[];
  onEditProduct: (p: Product) => void;
}) {
  const tracked = products.filter((p) => p.stock_quantity != null);
  const low = products.filter(isLowStock);
  const out = tracked.filter((p) => (p.stock_quantity ?? 0) <= 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 14, color: "#94a3b8", maxWidth: 640 }}>
        Products with a stock quantity set are tracked here. Adjust thresholds on each product in the Products
        tab (default low-stock threshold is 5).
      </p>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div>
          <strong>{tracked.length}</strong>
          <span style={{ color: "#94a3b8", marginLeft: 8 }}>SKU-tracked</span>
        </div>
        <div>
          <strong style={{ color: "#f59e0b" }}>{low.length}</strong>
          <span style={{ color: "#94a3b8", marginLeft: 8 }}>At or below threshold</span>
        </div>
        <div>
          <strong style={{ color: "#ef4444" }}>{out.length}</strong>
          <span style={{ color: "#94a3b8", marginLeft: 8 }}>Out of stock</span>
        </div>
      </div>

      {low.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No low-stock alerts.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {low.map((p) => (
            <AdminCard key={p.id} maxWidth={760}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>
                    Stock: <strong>{p.stock_quantity}</strong> · Threshold: {p.low_stock_threshold ?? 5}
                    {(p.stock_quantity ?? 0) <= 0 && (
                      <span style={{ color: "#ef4444", marginLeft: 8 }}>Out of stock</span>
                    )}
                  </div>
                </div>
                <button type="button" className="btn-primary" style={{ fontSize: 13 }} onClick={() => onEditProduct(p)}>
                  Edit product
                </button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
