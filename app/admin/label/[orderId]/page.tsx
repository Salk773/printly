"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import type { Order } from "@/app/admin/page";
import ShippingLabelPrint from "@/components/admin/ShippingLabelPrint";

function defaultLabelWidth(): number {
  const raw = process.env.NEXT_PUBLIC_LABEL_WIDTH_IN;
  const n = raw ? Number(raw) : 4;
  // Keep this fixed at 4in for shipping labels to match 100x150mm media.
  if (Number.isFinite(n) && n >= 4) return 4;
  return 4;
}

export default function AdminShippingLabelPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = typeof params?.orderId === "string" ? params.orderId : "";

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const labelWidthIn = defaultLabelWidth();

  const load = useCallback(async () => {
    if (!orderId) {
      setError("Missing order id");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      const res = await fetch(`/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        router.replace("/");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Could not load order");
        setLoading(false);
        return;
      }

      const body = await res.json();
      const row = body.order as Record<string, unknown>;
      if (!row?.id) {
        setError("Invalid response");
        setLoading(false);
        return;
      }

      let itemsRaw = row.items;
      if (typeof itemsRaw === "string") {
        try {
          itemsRaw = JSON.parse(itemsRaw) as unknown;
        } catch {
          itemsRaw = [];
        }
      }
      const items = Array.isArray(itemsRaw) ? itemsRaw : [];
      const normalized: Order = {
        id: String(row.id),
        order_number: row.order_number != null ? String(row.order_number) : null,
        guest_email: row.guest_email != null ? String(row.guest_email) : null,
        guest_name: row.guest_name != null ? String(row.guest_name) : null,
        phone: row.phone != null ? String(row.phone) : null,
        address_line_1:
          row.address_line_1 != null ? String(row.address_line_1) : null,
        address_line_2:
          row.address_line_2 != null ? String(row.address_line_2) : null,
        city: row.city != null ? String(row.city) : null,
        state: row.state != null ? String(row.state) : null,
        postal_code: row.postal_code != null ? String(row.postal_code) : null,
        items: items as Order["items"],
        total: (() => {
          const t = row.total;
          if (t == null || t === "") return 0;
          const n = typeof t === "number" ? t : Number(t);
          return Number.isFinite(n) ? n : 0;
        })(),
        status: row.status != null ? String(row.status) : "unknown",
        created_at:
          row.created_at != null ? String(row.created_at) : new Date().toISOString(),
        notes: row.notes != null ? String(row.notes) : null,
        archived: Boolean(row.archived),
        saved_address_id:
          row.saved_address_id != null ? String(row.saved_address_id) : null,
        stripe_checkout_session_id:
          row.stripe_checkout_session_id != null
            ? String(row.stripe_checkout_session_id)
            : null,
        stripe_payment_intent_id:
          row.stripe_payment_intent_id != null
            ? String(row.stripe_payment_intent_id)
            : null,
        shipping_cost: (() => {
          const s = row.shipping_cost;
          if (s == null || s === "") return null;
          const n = typeof s === "number" ? s : Number(s);
          return Number.isFinite(n) ? n : null;
        })(),
      };

      setOrder(normalized);
    } catch (e) {
      console.error(e);
      setError("Unexpected error loading order");
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!order || loading || error) return;
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("print") !== "1") return;
    const t = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(t);
  }, [order, loading, error]);

  if (loading) {
    return (
      <main style={{ padding: 40, color: "#e2e8f0", textAlign: "center" }}>
        Loading label…
      </main>
    );
  }

  if (error || !order) {
    return (
      <main style={{ padding: 40, maxWidth: 480, margin: "0 auto", color: "#e2e8f0" }}>
        <p>{error || "Order not found"}</p>
        <Link href="/admin" style={{ color: "#c084fc" }}>
          Back to admin
        </Link>
      </main>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: 4in 6in;
            margin: 0;
          }

          html,
          body {
            width: 4in !important;
            height: 6in !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #fff !important;
            color: #111 !important;
          }

          body * {
            visibility: hidden !important;
          }

          .label-no-print {
            display: none !important;
          }

          .shipping-label-root,
          .shipping-label-root * {
            visibility: visible !important;
          }

          .shipping-label-root {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 4in !important;
            height: 6in !important;
            overflow: hidden !important;
            background: #fff !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
            max-width: none !important;
            width: 4in !important;
            height: 6in !important;
            padding: 0.12in !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            background: #fff !important;
            color: #111 !important;
          }
        }
      `}</style>

      <main
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          padding: "24px 16px 48px",
        }}
      >
        <div
          className="label-no-print"
          style={{
            maxWidth: 560,
            margin: "0 auto 20px",
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            className="btn-primary"
            onClick={() => window.print()}
          >
            Print label
          </button>
          <Link href="/admin" className="btn-ghost" style={{ textDecoration: "none" }}>
            Back to admin
          </Link>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            Target printer: LENVII (Windows). Set roll width in driver to match{" "}
            {labelWidthIn}&quot; layout (override with{" "}
            <code style={{ color: "#cbd5e1" }}>NEXT_PUBLIC_LABEL_WIDTH_IN</code>).
          </span>
        </div>

        <ShippingLabelPrint order={order} labelWidthIn={labelWidthIn} />
      </main>
    </>
  );
}
