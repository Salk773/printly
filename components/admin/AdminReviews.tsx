"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import AdminCard from "@/components/admin/AdminCard";

export type AdminReviewRow = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  visible: boolean;
  created_at: string;
  product_name: string | null;
  user_email: string | null;
};

export default function AdminReviews({
  logAdminAction,
}: {
  logAdminAction?: (
    action: string,
    resource: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
  ) => void | Promise<void>;
}) {
  const [reviews, setReviews] = useState<AdminReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const authHeader = useCallback(async () => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = await authHeader();
      if (!h) {
        setReviews([]);
        return;
      }
      const res = await fetch("/api/admin/reviews", { headers: h });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to load reviews");
      setReviews(j.reviews ?? []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    load();
  }, [load]);

  const setVisible = async (id: string, visible: boolean) => {
    setBusyId(id);
    try {
      const h = await authHeader();
      if (!h) {
        toast.error("Not signed in");
        return;
      }
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { ...h, "Content-Type": "application/json" },
        body: JSON.stringify({ visible }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Update failed");
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, visible } : r)));
      await logAdminAction?.("review_visibility", "review", id, { visible });
      toast.success(visible ? "Review visible on storefront." : "Review hidden.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Permanently delete this review?")) return;
    setBusyId(id);
    try {
      const h = await authHeader();
      if (!h) {
        toast.error("Not signed in");
        return;
      }
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
        headers: h,
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Delete failed");
      setReviews((prev) => prev.filter((r) => r.id !== id));
      await logAdminAction?.("delete", "review", id, {});
      toast.success("Review deleted.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p style={{ opacity: 0.7 }}>Loading reviews…</p>;
  }

  if (!reviews.length) {
    return <p style={{ opacity: 0.7 }}>No reviews yet.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {reviews.map((r) => (
        <AdminCard key={r.id} maxWidth={900}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 12,
              alignItems: "start",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {r.product_name ?? "Product"}{" "}
                <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: 13 }}>
                  {r.rating}★ · {r.user_email ?? r.user_id.slice(0, 8)}
                </span>
              </div>
              {r.comment && (
                <p style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.5, margin: 0 }}>{r.comment}</p>
              )}
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                {new Date(r.created_at).toLocaleString()}{" "}
                {!r.visible && <span style={{ color: "#f59e0b" }}>· Hidden from storefront</span>}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={r.visible}
                  disabled={busyId === r.id}
                  onChange={() => setVisible(r.id, !r.visible)}
                />
                Visible
              </label>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: 12, color: "#ef4444" }}
                disabled={busyId === r.id}
                onClick={() => remove(r.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </AdminCard>
      ))}
    </div>
  );
}
