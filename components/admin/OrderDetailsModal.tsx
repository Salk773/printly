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
      }}
    >
      <div className="card-soft" style={{ padding: 20, maxWidth: 500 }}>
        <h3>Order Details</h3>
        <p>{order.guest_name}</p>
        <p>{order.total.toFixed(2)} AED</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
