"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import AdminCard from "@/components/admin/AdminCard";

type ShippingMethod = {
  id: string;
  name: string;
  description: string | null;
  cost: number;
  estimated_days: number;
  active: boolean;
};

export default function AdminShipping({
  logAdminAction,
}: {
  logAdminAction?: (
    action: string,
    resource: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
  ) => void | Promise<void>;
}) {
  const [rows, setRows] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

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
        setRows([]);
        return;
      }
      const res = await fetch("/api/admin/shipping-methods", { headers: h });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to load");
      setRows(j.shipping_methods ?? []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (row: ShippingMethod, patch: Partial<ShippingMethod>) => {
    setSavingId(row.id);
    try {
      const h = await authHeader();
      if (!h) {
        toast.error("Not signed in");
        return;
      }
      const res = await fetch(`/api/admin/shipping-methods/${row.id}`, {
        method: "PATCH",
        headers: { ...h, "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Save failed");
      const updated = j.shipping_method as ShippingMethod;
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      await logAdminAction?.("update", "shipping_method", row.id, patch);
      toast.success("Saved.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <p style={{ opacity: 0.7 }}>Loading shipping methods…</p>;
  if (!rows.length) return <p style={{ opacity: 0.7 }}>No shipping methods found.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 14, color: "#94a3b8", maxWidth: 640 }}>
        Checkout uses these rows from the database. Inactive methods are hidden from customers but remain
        listed here.
      </p>
      {rows.map((r) => (
        <AdminCard key={r.id} maxWidth={760}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>{r.name}</div>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr", alignItems: "end" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
              Cost (AED)
              <input
                className="input"
                type="number"
                step="0.01"
                min={0}
                defaultValue={r.cost}
                key={`${r.id}-cost-${r.cost}`}
                disabled={savingId === r.id}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isFinite(v) || v < 0) return;
                  if (v !== r.cost) save(r, { cost: v });
                }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
              Est. days
              <input
                className="input"
                type="number"
                min={0}
                max={365}
                defaultValue={r.estimated_days}
                key={`${r.id}-days-${r.estimated_days}`}
                disabled={savingId === r.id}
                onBlur={(e) => {
                  const v = Math.floor(Number(e.target.value));
                  if (!Number.isFinite(v)) return;
                  if (v !== r.estimated_days) save(r, { estimated_days: v });
                }}
              />
            </label>
            <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
              Description
              <textarea
                className="input"
                rows={2}
                defaultValue={r.description ?? ""}
                key={`${r.id}-desc`}
                disabled={savingId === r.id}
                onBlur={(e) => {
                  const v = e.target.value.trim() || null;
                  if (v !== (r.description ?? null)) save(r, { description: v });
                }}
              />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={r.active}
                disabled={savingId === r.id}
                onChange={(e) => save(r, { active: e.target.checked })}
              />
              Active at checkout
            </label>
          </div>
        </AdminCard>
      ))}
    </div>
  );
}
