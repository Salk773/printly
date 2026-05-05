import AdminCard from "@/components/admin/AdminCard";
import { Order } from "@/app/admin/page";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { useState } from "react";

function orderMatchesSearch(o: Order, q: string): boolean {
  if (!q) return true;
  const parts = [o.order_number, o.guest_name, o.guest_email]
    .filter((x): x is string => x != null && String(x).trim() !== "")
    .map((s) => String(s).toLowerCase());
  return parts.some((s) => s.includes(q));
}

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
  const [orderSearch, setOrderSearch] = useState("");

  const bucket = showArchived
    ? orders.filter((o) => o.archived)
    : orders.filter((o) => !o.archived);

  const query = orderSearch.trim().toLowerCase();
  const filteredOrders = query
    ? bucket.filter((o) => orderMatchesSearch(o, query))
    : bucket;

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
      case "refunded":
        return "#8b5cf6";
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
      case "refunded":
        return "rgba(139, 92, 246, 0.1)";
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
      // Get auth token for admin API call
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        toast.error("Please log in to update order status");
        reload();
        return;
      }

      const token = session.data.session.access_token;
      const response = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const response = await fetch("/api/orders/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete order");
      }

      // Optimistically remove from UI
      setOrders((prev: Order[]) => prev.filter((x) => x.id !== orderId));

      toast.success("Order deleted.");
      reload();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete order");
      reload(); // Reload to sync state
    } finally {
      setDeletingId(null);
    }
  };

  const toolbar = (
    <div
      style={{
        marginBottom: 20,
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
      }}
    >
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
        />
        Show archived orders
      </label>
      <input
        type="search"
        className="input"
        placeholder="Search order #, name, or email…"
        value={orderSearch}
        onChange={(e) => setOrderSearch(e.target.value)}
        style={{ flex: "1 1 220px", minWidth: 200, maxWidth: 420 }}
        aria-label="Search orders by number, customer name, or email"
      />
    </div>
  );

  if (!bucket.length) {
    return (
      <div>
        {toolbar}
        <p style={{ opacity: 0.6 }}>
          {showArchived ? "No archived orders found." : "No orders found."}
        </p>
      </div>
    );
  }

  if (!filteredOrders.length) {
    return (
      <div>
        {toolbar}
        <p style={{ opacity: 0.6 }}>
          No orders match your search. Try another order number, name, or email.
        </p>
      </div>
    );
  }

  return (
    <div>
      {toolbar}

      {filteredOrders.map((o) => (
        <AdminCard key={o.id} maxWidth={900} style={{ opacity: o.archived ? 0.6 : 1 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(100px, 2fr) minmax(52px, 0.85fr) minmax(72px, 1fr) minmax(240px, 1.5fr) auto auto auto auto auto",
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

            {/* STATUS — badge shows current color; select stays neutral (options can't be styled per-row in HTML) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto minmax(128px, 1fr)",
                gap: 8,
                alignItems: "center",
                width: "100%",
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  padding: "4px 8px",
                  borderRadius: 8,
                  color: getStatusColor(o.status),
                  background: getStatusBg(o.status),
                  whiteSpace: "nowrap",
                }}
              >
                {o.status}
              </span>
              <select
                className="select"
                value={o.status}
                aria-label="Change order status"
                style={{
                  fontWeight: 600,
                  color: "#e5e7eb",
                  background: "#020617",
                  border: "1px solid rgba(148,163,184,0.35)",
                  borderRadius: 8,
                  padding: "6px 10px",
                  fontSize: 13,
                  width: "100%",
                  minWidth: 128,
                  maxWidth: "100%",
                }}
                onChange={(e) => handleStatusChange(o.id, e.target.value, o.status)}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

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

            {/* LABEL (opens print page) */}
            <a
              className="btn-ghost"
              href={`/admin/label/${o.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, textAlign: "center", textDecoration: "none" }}
              title="Shipping label"
            >
              Label
            </a>

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
