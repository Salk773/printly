"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import AdminCard from "@/components/admin/AdminCard";

type EmailEvent = {
  id: string;
  notification_type: string;
  order_id: string | null;
  to_email: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
};

export default function AdminEmailCenter() {
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        setEvents([]);
        return;
      }
      const res = await fetch("/api/admin/email-events?limit=150", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setEvents(j.events ?? []);
      setTotal(j.total ?? 0);
      setNote(j.note ?? null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const downloadPrefs = async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        toast.error("Not signed in");
        return;
      }
      const res = await fetch("/api/admin/email-preferences/export", {
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
      a.download = `email-preferences.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download started.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <AdminCard maxWidth={760}>
        <h4 style={{ marginTop: 0 }}>Marketing & notification preferences</h4>
        <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 12 }}>
          Export a CSV of signed-in users&apos; email preference rows (account settings). Use only as allowed by
          your privacy policy.
        </p>
        <button type="button" className="btn-primary" onClick={downloadPrefs}>
          Download CSV
        </button>
      </AdminCard>

      <AdminCard maxWidth={900}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <h4 style={{ margin: 0 }}>Order email log</h4>
          <span style={{ fontSize: 13, color: "#94a3b8" }}>
            {total} event{total !== 1 ? "s" : ""} (latest 150 shown)
          </span>
        </div>
        {note && (
          <p style={{ fontSize: 13, color: "#f59e0b", marginTop: 8 }}>
            {note}
          </p>
        )}
        {loading ? (
          <p style={{ opacity: 0.7, marginTop: 12 }}>Loading…</p>
        ) : events.length === 0 ? (
          <p style={{ opacity: 0.7, marginTop: 12 }}>No email events recorded yet.</p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(148,163,184,0.3)" }}>
                  <th style={{ padding: "6px 4px" }}>Time</th>
                  <th style={{ padding: "6px 4px" }}>Type</th>
                  <th style={{ padding: "6px 4px" }}>To</th>
                  <th style={{ padding: "6px 4px" }}>Status</th>
                  <th style={{ padding: "6px 4px" }}>Order</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id} style={{ borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
                    <td style={{ padding: "6px 4px", whiteSpace: "nowrap", color: "#94a3b8" }}>
                      {new Date(ev.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: "6px 4px" }}>{ev.notification_type}</td>
                    <td style={{ padding: "6px 4px", wordBreak: "break-all", maxWidth: 180 }}>
                      {ev.to_email ?? "—"}
                    </td>
                    <td style={{ padding: "6px 4px", color: ev.status === "failed" ? "#ef4444" : "#22c55e" }}>
                      {ev.status}
                      {ev.error_message && (
                        <span style={{ display: "block", fontSize: 11, marginTop: 2 }}>{ev.error_message}</span>
                      )}
                    </td>
                    <td style={{ padding: "6px 4px", fontSize: 12, wordBreak: "break-all" }}>
                      {ev.order_id ? ev.order_id.slice(0, 8) + "…" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
