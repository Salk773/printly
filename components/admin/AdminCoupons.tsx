"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import AdminCard from "@/components/admin/AdminCard";

export type AdminCoupon = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  value: number;
  min_purchase: number | null;
  max_discount: number | null;
  valid_from: string | null;
  valid_until: string | null;
  usage_limit: number | null;
  used_count: number | null;
  active: boolean;
  created_at?: string;
};

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(local: string): string | null {
  const t = local.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

type FormState = {
  code: string;
  discount_type: "percentage" | "fixed";
  value: string;
  min_purchase: string;
  max_discount: string;
  valid_from: string;
  valid_until: string;
  usage_limit: string;
  active: boolean;
};

const emptyForm = (): FormState => ({
  code: "",
  discount_type: "percentage",
  value: "10",
  min_purchase: "0",
  max_discount: "",
  valid_from: toDatetimeLocalValue(new Date().toISOString()),
  valid_until: "",
  usage_limit: "",
  active: true,
});

const couponToForm = (c: AdminCoupon): FormState => ({
  code: c.code,
  discount_type: c.discount_type,
  value: String(c.value),
  min_purchase: String(c.min_purchase ?? 0),
  max_discount: c.max_discount != null ? String(c.max_discount) : "",
  valid_from: toDatetimeLocalValue(c.valid_from),
  valid_until: toDatetimeLocalValue(c.valid_until),
  usage_limit: c.usage_limit != null ? String(c.usage_limit) : "",
  active: c.active,
});

export default function AdminCoupons({
  logAdminAction,
}: {
  logAdminAction?: (
    action: string,
    resource: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
  ) => void | Promise<void>;
}) {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const authHeader = useCallback(async () => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await authHeader();
      if (!headers) {
        toast.error("Not signed in");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/admin/coupons", { headers });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load coupons");
        setLoading(false);
        return;
      }
      setCoupons(data.coupons || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    load();
  }, [load]);

  const parseNum = (s: string, fallback: number | null = null) => {
    const t = s.trim();
    if (!t) return fallback;
    const n = Number(t);
    return Number.isFinite(n) ? n : fallback;
  };

  const submitCreate = async () => {
    const headers = await authHeader();
    if (!headers) return;

    const code = form.code.trim();
    if (!code) {
      toast.error("Enter a code");
      return;
    }

    const value = parseNum(form.value, NaN);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid discount value");
      return;
    }

    const minPurchase = parseNum(form.min_purchase, 0) ?? 0;
    const maxDiscRaw = form.max_discount.trim();
    const max_discount =
      maxDiscRaw.length === 0 ? null : parseNum(maxDiscRaw, NaN);
    if (max_discount != null && (!Number.isFinite(max_discount) || max_discount <= 0)) {
      toast.error("Max discount must be a positive number or empty");
      return;
    }

    const usageRaw = form.usage_limit.trim();
    const usage_limit =
      usageRaw.length === 0 ? null : parseInt(usageRaw, 10);
    if (usage_limit != null && (!Number.isFinite(usage_limit) || usage_limit < 1)) {
      toast.error("Usage limit must be a positive integer or empty");
      return;
    }

    const valid_from_iso = fromDatetimeLocal(form.valid_from);
    const valid_until_iso = fromDatetimeLocal(form.valid_until);

    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discount_type: form.discount_type,
          value,
          min_purchase: minPurchase,
          max_discount,
          valid_from: valid_from_iso || undefined,
          valid_until: valid_until_iso,
          usage_limit,
          active: form.active,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not create coupon");
        return;
      }
      toast.success(`Coupon ${data.coupon?.code || code} created`);
      await logAdminAction?.("create", "coupon", data.coupon?.id, { code });
      setForm(emptyForm());
      load();
    } catch (e) {
      console.error(e);
      toast.error("Create failed");
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async (id: string) => {
    const headers = await authHeader();
    if (!headers) return;

    const value = parseNum(form.value, NaN);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid discount value");
      return;
    }

    const minPurchase = parseNum(form.min_purchase, 0) ?? 0;
    const maxDiscRaw = form.max_discount.trim();
    const max_discount =
      maxDiscRaw.length === 0 ? null : parseNum(maxDiscRaw, NaN);
    if (max_discount != null && (!Number.isFinite(max_discount) || max_discount <= 0)) {
      toast.error("Max discount must be a positive number or empty");
      return;
    }

    const usageRaw = form.usage_limit.trim();
    const usage_limit =
      usageRaw.length === 0 ? null : parseInt(usageRaw, 10);
    if (usage_limit != null && (!Number.isFinite(usage_limit) || usage_limit < 1)) {
      toast.error("Usage limit must be a positive integer or empty");
      return;
    }

    const valid_from_iso = fromDatetimeLocal(form.valid_from);
    const valid_until_iso = fromDatetimeLocal(form.valid_until);

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim(),
          discount_type: form.discount_type,
          value,
          min_purchase: minPurchase,
          max_discount,
          valid_from: valid_from_iso,
          valid_until: valid_until_iso,
          usage_limit,
          active: form.active,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not update coupon");
        return;
      }
      toast.success("Coupon updated");
      await logAdminAction?.("update", "coupon", id, { code: form.code.trim() });
      setEditingId(null);
      setForm(emptyForm());
      load();
    } catch (e) {
      console.error(e);
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: AdminCoupon) => {
    const headers = await authHeader();
    if (!headers) return;
    const res = await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Update failed");
      return;
    }
    toast.success(c.active ? "Coupon deactivated" : "Coupon activated");
    await logAdminAction?.("toggle_active", "coupon", c.id, {
      code: c.code,
      active: !c.active,
    });
    load();
  };

  const deleteCoupon = async (c: AdminCoupon) => {
    if (!confirm(`Delete coupon ${c.code}? This cannot be undone.`)) return;
    const headers = await authHeader();
    if (!headers) return;
    const res = await fetch(`/api/admin/coupons/${c.id}`, {
      method: "DELETE",
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Delete failed");
      return;
    }
    toast.success("Coupon deleted");
    await logAdminAction?.("delete", "coupon", c.id, { code: c.code });
    if (editingId === c.id) {
      setEditingId(null);
      setForm(emptyForm());
    }
    load();
  };

  const startEdit = (c: AdminCoupon) => {
    setEditingId(c.id);
    setForm(couponToForm(c));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  return (
    <>
      <AdminCard maxWidth={720}>
        <h2 style={{ marginBottom: 12 }}>
          {editingId ? "Edit discount code" : "Create discount code"}
        </h2>
        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>
          Codes are case-insensitive for shoppers (stored uppercase). Link checkout to{" "}
          <code style={{ color: "#cbd5e1" }}>/api/checkout/coupon</code> from your cart flow.
        </p>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          }}
        >
          <label style={{ gridColumn: "1 / -1" }}>
            <span style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 4 }}>
              Code
            </span>
            <input
              className="input"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="SAVE10"
              disabled={saving}
            />
          </label>

          <label>
            <span style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 4 }}>
              Type
            </span>
            <select
              className="select"
              value={form.discount_type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  discount_type: e.target.value as "percentage" | "fixed",
                }))
              }
            >
              <option value="percentage">Percentage off</option>
              <option value="fixed">Fixed AED off</option>
            </select>
          </label>

          <label>
            <span style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 4 }}>
              {form.discount_type === "percentage" ? "Percent (%)" : "Amount (AED)"}
            </span>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            />
          </label>

          <label>
            <span style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 4 }}>
              Min purchase (AED)
            </span>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={form.min_purchase}
              onChange={(e) => setForm((f) => ({ ...f, min_purchase: e.target.value }))}
            />
          </label>

          <label>
            <span style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 4 }}>
              Max discount (AED, optional)
            </span>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              placeholder="% coupons only"
              value={form.max_discount}
              onChange={(e) => setForm((f) => ({ ...f, max_discount: e.target.value }))}
            />
          </label>

          <label>
            <span style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 4 }}>
              Valid from
            </span>
            <input
              className="input"
              type="datetime-local"
              value={form.valid_from}
              onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))}
            />
          </label>

          <label>
            <span style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 4 }}>
              Valid until (optional)
            </span>
            <input
              className="input"
              type="datetime-local"
              value={form.valid_until}
              onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
            />
          </label>

          <label>
            <span style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 4 }}>
              Usage limit (optional)
            </span>
            <input
              className="input"
              type="number"
              min="1"
              step="1"
              placeholder="Unlimited if empty"
              value={form.usage_limit}
              onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            <span style={{ fontSize: 14 }}>Active</span>
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          {editingId ? (
            <>
              <button
                type="button"
                className="btn-primary"
                disabled={saving}
                onClick={() => submitEdit(editingId)}
              >
                Save changes
              </button>
              <button type="button" className="btn-ghost" disabled={saving} onClick={cancelEdit}>
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-primary"
              disabled={saving}
              onClick={submitCreate}
            >
              Create coupon
            </button>
          )}
        </div>
      </AdminCard>

      <h2 style={{ marginTop: 28, marginBottom: 12 }}>Existing codes</h2>
      {loading ? (
        <p style={{ opacity: 0.7 }}>Loading…</p>
      ) : coupons.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No coupons yet.</p>
      ) : (
        coupons.map((c) => (
          <AdminCard key={c.id} maxWidth={720}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <strong style={{ fontSize: 18, letterSpacing: "0.04em" }}>{c.code}</strong>
                <span
                  style={{
                    marginLeft: 10,
                    fontSize: 12,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: c.active ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.2)",
                    color: c.active ? "#22c55e" : "#94a3b8",
                  }}
                >
                  {c.active ? "Active" : "Inactive"}
                </span>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>
                  {c.discount_type === "percentage"
                    ? `${c.value}% off`
                    : `${c.value} AED off`}
                  {c.min_purchase != null && c.min_purchase > 0
                    ? ` · Min ${Number(c.min_purchase).toFixed(2)} AED`
                    : ""}
                  {c.discount_type === "percentage" && c.max_discount != null
                    ? ` · Max ${Number(c.max_discount).toFixed(2)} AED`
                    : ""}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Used {c.used_count ?? 0}
                  {c.usage_limit != null ? ` / ${c.usage_limit}` : " / ∞"} · Valid{" "}
                  {c.valid_from ? new Date(c.valid_from).toLocaleString() : "—"}
                  {" → "}
                  {c.valid_until ? new Date(c.valid_until).toLocaleString() : "no end"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="btn-ghost" onClick={() => startEdit(c)}>
                  Edit
                </button>
                <button type="button" className="btn-ghost" onClick={() => toggleActive(c)}>
                  {c.active ? "Deactivate" : "Activate"}
                </button>
                <button type="button" className="btn-danger" onClick={() => deleteCoupon(c)}>
                  Delete
                </button>
              </div>
            </div>
          </AdminCard>
        ))
      )}
    </>
  );
}
