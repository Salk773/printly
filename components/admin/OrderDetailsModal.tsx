import { Order } from "@/app/admin/page";

export default function OrderDetailsModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
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
        style={{ maxWidth: 520, width: "100%", padding: 20 }}
      >
        <h3 style={{ marginBottom: 12 }}>Order Details</h3>

        {/* CUSTOMER */}
        <p>
          <strong>Customer:</strong>{" "}
          {order.guest_name || "Guest"}{" "}
          {order.guest_email && `(${order.guest_email})`}
        </p>

        {/* CONTACT */}
        {order.phone && (
          <p>
            <strong>Phone:</strong> {order.phone}
          </p>
        )}

        {/* ADDRESS */}
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

        {/* STATUS */}
        <p>
          <strong>Status:</strong> {order.status}
        </p>

        {/* ITEMS */}
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
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='60' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: "0.9rem" }}>
                    {i.name}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                    Qty: {i.quantity}
                  </div>
                </div>
                <div style={{ fontWeight: 600, color: "#c084fc", fontSize: "0.9rem" }}>
                  {(i.price * i.quantity).toFixed(2)} AED
                </div>
              </div>
            );
          })}
        </div>

        {/* NOTES */}
        {order.notes && (
          <p>
            <strong>Notes:</strong> {order.notes}
          </p>
        )}

        {/* TOTAL */}
        <p style={{ fontWeight: 700 }}>
          Total: {order.total.toFixed(2)} AED
        </p>

        <button
          className="btn-primary"
          style={{ marginTop: 12 }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
