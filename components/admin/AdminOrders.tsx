import AdminCard from "@/components/admin/AdminCard";
import { Order } from "@/app/admin/page";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { useState } from "react";

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
  const [showArchived, setShowArchived] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredOrders = showArchived
    ? orders.filter((o) => o.archived)
    : orders.filter((o) => !o.archived);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#22c55e";
      case "processing":
        return "#3b82f6";
      case "paid":
        return "#3b82f6";
      case "cancelled":
        return "#ef4444";
      default:
        return "#f59e0b";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "completed":
        return "rgba(34, 197, 94, 0.1)";
      case "processing":
        return "rgba(59, 130, 246, 0.1)";
      case "paid":
        return "rgba(59, 130, 246, 0.1)";
      case "cancelled":
        return "rgba(239, 68, 68, 0.1)";
      default:
        return "rgba(245, 158, 11, 0.1)";
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string, currentStatus: string) => {
    // Optimistic UI update
    setOrders((prev: Order[]) =>
      prev.map((x) => (x.id === orderId ? { ...x, status: newStatus } : x))
    );

    try {
      const response = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          newStatus,
          currentStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update status");
      }

      // Only send notification for paid -> processing transition
      if (currentStatus === "paid" && newStatus === "processing") {
        toast.success("Order status updated to processing. Customer notified.");
      } else {
        toast.success(`Order status updated to ${newStatus}.`);
      }
    } catch (error: any) {
      console.error("Status update error:", error);
      toast.error(error.message || "Failed to update order status");
      reload(); // Rollback on error
    }
  };

  const handleArchive = async (orderId: string, archive: boolean) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ archived: archive })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev: Order[]) =>
        prev.map((x) => (x.id === orderId ? { ...x, archived: archive } : x))
      );

      toast.success(archive ? "Order archived." : "Order unarchived.");
      reload();
    } catch (error: any) {
      console.error("Archive error:", error);
      toast.error("Failed to archive order");
      reload();
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm("Are you sure you want to permanently delete this order? This action cannot be undone.")) {
      return;
    }

    setDeletingId(orderId);
    try {
      const { error } = await supabase.from("orders").delete().eq("id", orderId);

      if (error) throw error;

      toast.success("Order deleted.");
      reload();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete order");
    } finally {
      setDeletingId(null);
    }
  };

  if (!filteredOrders.length) {
    return (
      <div>
        <div style={{ marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived orders
          </label>
        </div>
        <p style={{ opacity: 0.6 }}>
          {showArchived ? "No archived orders found." : "No orders found."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show archived orders
        </label>
      </div>

      {filteredOrders.map((o) => (
        <AdminCard key={o.id} maxWidth={900} style={{ opacity: o.archived ? 0.6 : 1 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1.2fr auto auto auto auto",
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
              {o.archived && (
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
                  Archived
                </div>
              )}
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
                color: getStatusColor(o.status),
              }}
              onChange={(e) => handleStatusChange(o.id, e.target.value, o.status)}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* ARCHIVE/UNARCHIVE */}
            <button
              className="btn-ghost"
              onClick={() => handleArchive(o.id, !o.archived)}
              style={{ fontSize: 12 }}
              title={o.archived ? "Unarchive" : "Archive"}
            >
              {o.archived ? "📦" : "📁"}
            </button>

            {/* DELETE */}
            <button
              className="btn-ghost"
              onClick={() => handleDelete(o.id)}
              disabled={deletingId === o.id}
              style={{ fontSize: 12, color: deletingId === o.id ? "#9ca3af" : "#ef4444" }}
              title="Delete"
            >
              {deletingId === o.id ? "..." : "🗑️"}
            </button>

            {/* VIEW */}
            <button
              className="btn-ghost"
              onClick={() => onView(o)}
            >
              View
            </button>
          </div>
        </AdminCard>
      ))}
    </div>
  );
}
