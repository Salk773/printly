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
  if (!orders.length) return <p>No orders found.</p>;

  return (
    <>
      {orders.map((o) => (
        <div key={o.id} className="card-soft" style={{ padding: 14 }}>
          <strong>{o.guest_name}</strong>
          <div>{o.total.toFixed(2)} AED</div>

          <select
            value={o.status}
            onChange={async (e) => {
              const status = e.target.value;

              setOrders((prev: Order[]) =>
                prev.map((x) => (x.id === o.id ? { ...x, status } : x))
              );

              const { error } = await supabase
                .from("orders")
                .update({ status })
                .eq("id", o.id);

              if (error) reload();
            }}
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button onClick={() => onView(o)}>View</button>
        </div>
      ))}
    </>
  );
}
