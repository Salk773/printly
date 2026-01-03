import AdminCard from "@/components/admin/AdminCard";
import { Order } from "@/app/admin/page";
import { supabase } from "@/lib/supabaseClient";

export default function AdminOrders({
  orders,
  setOrders,
  reload,
  onView,
}: {
  orders: Order[];
  setOrders: any;
  reload: () => void;
  onView: (o: Order) => void;
}) {
  if (!orders.length) {
    return <p style={{ opacity: 0.6 }}>No orders found.</p>;
  }

  return (
    <>
      {orders.map((o) => (
        <AdminCard key={o.id} maxWidth={900}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1.2fr auto auto",
              gap: 12,
              alignItems: "center",
            }}
          >
            {/* CUSTOMER */}
            <div>
              <strong>{o.guest_name || "Guest"}</strong>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {o.guest_email}
              </div>
              <div style={{ fontSize: 11, opacity: 0.4 }}>
                {new Date(o.created_at).toLocaleString()}
              </div>
            </div>

            {/* ITEMS */}
            <div style={{ fontSize: 13 }}>
              {o.items.length} items
            </div>

            {/* TOTAL */}
            <div style={{ fontWeight: 700 }}>
              {o.total.toFixed(2)} AED
            </div>

            {/* STATUS */}
            <select
              className="select"
              value={o.status}
              style={{
                fontWeight: 600,
                color:
                  o.status === "completed"
                    ? "#22c55e"
                    : o.status === "paid"
                    ? "#3b82f6"
                    : o.status === "cancelled"
                    ? "#ef4444"
                    : "#f59e0b",
              }}
              onChange={async (e) => {
                const status = e.target.value;

                // optimistic UI update
                setOrders((prev: Order[]) =>
                  prev.map((x) =>
                    x.id === o.id ? { ...x, status } : x
                  )
                );

                // persist
                const { error } = await supabase
                  .from("orders")
                  .update({ status })
                  .eq("id", o.id);

                // rollback if needed
                if (error) reload();
              }}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* ACTION */}
            <button
              className="btn-ghost"
              onClick={() => onView(o)}
            >
              View
            </button>
          </div>
        </AdminCard>
      ))}
    </>
  );
}
