"use client";

import AdminCard from "@/components/admin/AdminCard";
import { Order } from "@/app/admin/page";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { useCallback, useMemo, useState } from "react";

function orderMatchesSearch(o: Order, q: string): boolean {
  if (!q) return true;
  const parts = [o.order_number, o.guest_name, o.guest_email]
    .filter((x): x is string => x != null && String(x).trim() !== "")
    .map((s) => String(s).toLowerCase());
  return parts.some((s) => s.includes(q));
}

function dateInRange(created: string, from: string, to: string): boolean {
  const t = new Date(created).getTime();
  if (from) {
    const f = new Date(`${from}T00:00:00.000Z`).getTime();
    if (t < f) return false;
  }
  if (to) {
    const e = new Date(`${to}T23:59:59.999Z`).getTime();
    if (t > e) return false;
  }
  return true;
}

const STATUS_OPTIONS = ["all", "pending", "paid", "processing", "completed", "cancelled", "refunded"] as const;

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
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("processing");
  const [bulkWorking, setBulkWorking] = useState(false);
  const [exporting, setExporting] = useState(false);

  const bucket = useMemo(
    () =>
      showArchived ? orders.filter((o) => o.archived) : orders.filter((o) => !o.archived),
    [orders, showArchived]
  );

  const pipelineFiltered = useMemo(() => {
    let rows = bucket;
    if (statusFilter !== "all") {
      rows = rows.filter((o) => o.status === statusFilter);
    }
    rows = rows.filter((o) => dateInRange(o.created_at, dateFrom, dateTo));
    const query = orderSearch.trim().toLowerCase();
    if (query) {
      rows = rows.filter((o) => orderMatchesSearch(o, query));
    }
    return rows;
  }, [bucket, statusFilter, dateFrom, dateTo, orderSearch]);

  const query = orderSearch.trim().toLowerCase();

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selectAllVisible = () => {
    setSelected(new Set(pipelineFiltered.map((o) => o.id)));
  };

  const clearSelection = () => setSelected(new Set());

  const exportCsv = async () => {
    setExporting(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        toast.error("Please log in");
        return;
      }
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const res = await fetch(`/api/admin/orders/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const applyBulkStatus = async () => {
    const ids = pipelineFiltered.filter((o) => selected.has(o.id)).map((o) => o.id);
    if (!ids.length) {
      toast.error("Select at least one order in the current list.");
      return;
    }
    if (!confirm(`Update ${ids.length} order(s) to “${bulkStatus}”?`)) return;

    setBulkWorking(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        toast.error("Please log in");
        return;
      }
      const res = await fetch("/api/admin/orders/bulk-status", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderIds: ids,
          newStatus: bulkStatus,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Bulk update failed");

      if (result.failed > 0) {
        toast.error(`Updated with ${result.failed} failure(s). Refresh recommended.`);
      } else {
        toast.success(`Updated ${result.updated} order(s).`);
      }
      clearSelection();
      reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Bulk update failed");
      reload();
    } finally {
      setBulkWorking(false);
    }
  };

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
    setOrders((prev: Order[]) =>
      prev.map((x) => (x.id === orderId ? { ...x, status: newStatus } : x))
    );

    try {
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

      if (currentStatus === "paid" && newStatus === "processing") {
        toast.success("Order status updated to processing. Customer notified.");
      } else {
        toast.success(`Order status updated to ${newStatus}.`);
      }
    } catch (error: any) {
      console.error("Status update error:", error);
      toast.error(error.message || "Failed to update order status");
      reload();
    }
  };

  const handleArchive = async (orderId: string, archive: boolean) => {
    try {
      const { error } = await supabase.from("orders").update({ archived: archive }).eq("id", orderId);

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

      setOrders((prev: Order[]) => prev.filter((x) => x.id !== orderId));
      setSelected((prev) => {
        const n = new Set(prev);
        n.delete(orderId);
        return n;
      });

      toast.success("Order deleted.");
      reload();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete order");
      reload();
    } finally {
      setDeletingId(null);
    }
  };

  const toolbar = (
    <div
      style={{
        marginBottom: 16,
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
        Show archived
      </label>
      <select
        className="select"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
        aria-label="Filter by status"
        style={{ minWidth: 140 }}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s === "all" ? "All statuses" : s}
          </option>
        ))}
      </select>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        From
        <input
          type="date"
          className="input"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        To
        <input
          type="date"
          className="input"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </label>
      <input
        type="search"
        className="input"
        placeholder="Search order #, name, or email…"
        value={orderSearch}
        onChange={(e) => setOrderSearch(e.target.value)}
        style={{ flex: "1 1 200px", minWidth: 180, maxWidth: 400 }}
        aria-label="Search orders by number, customer name, or email"
      />
      <button type="button" className="btn-ghost" disabled={exporting} onClick={exportCsv}>
        {exporting ? "…" : "Export CSV"}
      </button>
    </div>
  );

  const bulkBar =
    selected.size > 0 ? (
      <AdminCard maxWidth={900} style={{ marginBottom: 16, padding: "12px 16px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 14 }}>
            {selected.size} selected (visible list)
          </span>
          <select
            className="select"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            style={{ minWidth: 140 }}
          >
            <option value="pending">pending</option>
            <option value="paid">paid</option>
            <option value="processing">processing</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
            <option value="refunded">refunded</option>
          </select>
          <button type="button" className="btn-primary" disabled={bulkWorking} onClick={applyBulkStatus}>
            {bulkWorking ? "…" : "Apply to selected"}
          </button>
          <button type="button" className="btn-ghost" onClick={selectAllVisible}>
            Select all in list
          </button>
          <button type="button" className="btn-ghost" onClick={clearSelection}>
            Clear
          </button>
        </div>
      </AdminCard>
    ) : null;

  if (!bucket.length) {
    return (
      <div>
        {toolbar}
        <p style={{ opacity: 0.6 }}>{showArchived ? "No archived orders found." : "No orders found."}</p>
      </div>
    );
  }

  if (!pipelineFiltered.length) {
    return (
      <div>
        {toolbar}
        <p style={{ opacity: 0.6 }}>
          No orders match your filters
          {query ? " or search" : ""}. Adjust status, dates, or search.
        </p>
      </div>
    );
  }

  return (
    <div>
      {toolbar}
      {bulkBar}

      {pipelineFiltered.map((o) => (
        <AdminCard key={o.id} maxWidth={900} style={{ opacity: o.archived ? 0.6 : 1 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "auto minmax(100px, 2fr) minmax(52px, 0.85fr) minmax(72px, 1fr) minmax(240px, 1.5fr) auto auto auto auto auto auto",
              gap: 12,
              alignItems: "center",
            }}
          >
            <input
              type="checkbox"
              checked={selected.has(o.id)}
              onChange={() => toggleSelect(o.id)}
              aria-label={`Select order ${o.order_number ?? o.id}`}
            />

            <div>
              <strong>{o.guest_name || "Guest"}</strong>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{o.guest_email}</div>
              <div style={{ fontSize: 11, opacity: 0.4 }}>{new Date(o.created_at).toLocaleString()}</div>
              {o.archived && (
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>Archived</div>
              )}
            </div>

            <div style={{ fontSize: 13 }}>{o.items.length} items</div>

            <div style={{ fontWeight: 700 }}>{o.total.toFixed(2)} AED</div>

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

            <button
              className="btn-ghost"
              onClick={() => handleArchive(o.id, !o.archived)}
              style={{ fontSize: 12 }}
              title={o.archived ? "Unarchive" : "Archive"}
            >
              {o.archived ? "📦" : "📁"}
            </button>

            <button
              className="btn-ghost"
              onClick={() => handleDelete(o.id)}
              disabled={deletingId === o.id}
              style={{ fontSize: 12, color: deletingId === o.id ? "#9ca3af" : "#ef4444" }}
              title="Delete"
            >
              {deletingId === o.id ? "..." : "🗑️"}
            </button>

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

            <button className="btn-ghost" onClick={() => onView(o)}>
              View
            </button>
          </div>
        </AdminCard>
      ))}
    </div>
  );
}
