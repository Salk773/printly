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
        <strong>Items</strong>
        <ul style={{ marginTop: 6, marginBottom: 12 }}>
          {order.items.map((i, idx) => (
            <li key={idx}>
              {i.name} × {i.quantity} —{" "}
              {(i.price * i.quantity).toFixed(2)} AED
            </li>
          ))}
        </ul>

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
