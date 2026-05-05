"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import AdminCard from "@/components/admin/AdminCard";

type Customer = {
  email: string;
  name: string | null;
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        setCustomers([]);
        return;
      }
      const res = await fetch("/api/admin/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setCustomers(j.customers ?? []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p style={{ opacity: 0.7 }}>Loading customers…</p>;
  if (!customers.length) return <p style={{ opacity: 0.7 }}>No orders with email yet.</p>;

  return (
    <AdminCard maxWidth={900}>
      <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 16 }}>
        Aggregated from order guest emails (same person may use multiple addresses).
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(148,163,184,0.3)" }}>
              <th style={{ padding: "8px 6px" }}>Email</th>
              <th style={{ padding: "8px 6px" }}>Name</th>
              <th style={{ padding: "8px 6px" }}>Orders</th>
              <th style={{ padding: "8px 6px" }}>Lifetime spent</th>
              <th style={{ padding: "8px 6px" }}>Last order</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.email} style={{ borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
                <td style={{ padding: "8px 6px", wordBreak: "break-all" }}>{c.email}</td>
                <td style={{ padding: "8px 6px", color: "#94a3b8" }}>{c.name ?? "—"}</td>
                <td style={{ padding: "8px 6px" }}>{c.order_count}</td>
                <td style={{ padding: "8px 6px" }}>{c.total_spent.toFixed(2)} AED</td>
                <td style={{ padding: "8px 6px", color: "#94a3b8", fontSize: 13 }}>
                  {c.last_order_at ? new Date(c.last_order_at).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminCard>
  );
}
