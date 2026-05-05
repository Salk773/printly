import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { verifyAdmin } from "@/lib/auth/adminAuth";
import { logApiCall, logApiError } from "@/lib/logger";
import { createClient } from "@supabase/supabase-js";
import {
  type RawOrderRow,
  buildChartSeries,
  buildMonthlySales,
  buildProductPerformance,
  customerInsights,
  daysBetweenInclusive,
  endOfUtcDay,
  funnelCounts,
  funnelRevenueByStatus,
  growthPct,
  isSalesStatus,
  startOfUtcDay,
  summarizePeriod,
} from "@/lib/admin/analyticsAggregate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Use * so missing optional columns (e.g. shipping_cost from migration 011) do not break PostgREST. */
const ORDER_SELECT = "*";

type Preset = "7d" | "30d" | "90d" | "all" | "custom";

function parsePreset(value: string | null): Preset {
  if (value === "7d" || value === "30d" || value === "90d" || value === "all" || value === "custom") {
    return value;
  }
  return "30d";
}

function resolveRange(
  preset: Preset,
  fromParam: string | null,
  toParam: string | null
): { from: Date; to: Date; compare: boolean } | { error: string } {
  const now = new Date();

  if (preset === "custom") {
    if (!fromParam || !toParam) {
      return { error: "Custom range requires from and to (ISO dates)" };
    }
    const from = startOfUtcDay(new Date(fromParam));
    const to = endOfUtcDay(new Date(toParam));
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return { error: "Invalid from or to date" };
    }
    if (from.getTime() > to.getTime()) {
      return { error: "from must be before to" };
    }
    return { from, to, compare: true };
  }

  if (preset === "all") {
    return { from: new Date(0), to: endOfUtcDay(now), compare: false };
  }

  const end = endOfUtcDay(now);
  const start = startOfUtcDay(new Date());
  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { from: start, to: end, compare: true };
}

function previousRange(
  from: Date,
  to: Date
): { from: Date; to: Date } {
  const spanMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - spanMs);
  return { from: startOfUtcDay(prevFrom), to: endOfUtcDay(prevTo) };
}

export async function GET(req: NextRequest) {
  const ipAddress =
    req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    const authResult = await verifyAdmin(req);

    if (!authResult.authorized) {
      const statusCode = authResult.error?.includes("not an admin") ? 403 : 401;
      logApiCall("GET", "/api/admin/analytics", statusCode, {
        error: authResult.error,
        ipAddress,
      }, undefined, ipAddress);
      return NextResponse.json(
        { error: authResult.error },
        { status: statusCode }
      );
    }

    const { searchParams } = new URL(req.url);
    const preset = parsePreset(searchParams.get("preset"));
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const resolved = resolveRange(preset, fromParam, toParam);
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    const { from, to, compare } = resolved;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const fromIso = from.getTime() === 0 ? null : from.toISOString();
    const toIso = to.toISOString();

    let currentQuery = supabaseAdmin
      .from("orders")
      .select(ORDER_SELECT)
      .order("created_at", { ascending: false });

    if (fromIso) {
      currentQuery = currentQuery.gte("created_at", fromIso);
    }
    currentQuery = currentQuery.lte("created_at", toIso);

    const { data: currentRows, error: curErr } = await currentQuery;
    if (curErr) throw curErr;

    const periodOrders = (currentRows || []) as RawOrderRow[];
    const rangeDays =
      from.getTime() === 0
        ? null
        : daysBetweenInclusive(from, to);

    const compareRange =
      compare && from.getTime() > 0
        ? previousRange(from, to)
        : null;

    let compareOrders: RawOrderRow[] = [];
    if (compareRange) {
      const { data: co } = await supabaseAdmin
        .from("orders")
        .select(ORDER_SELECT)
        .gte("created_at", compareRange.from.toISOString())
        .lte("created_at", compareRange.to.toISOString())
        .order("created_at", { ascending: false });
      compareOrders = (co || []) as RawOrderRow[];
    }

    let priorEmailSet = new Set<string>();
    if (fromIso) {
      const { data: priorRows } = await supabaseAdmin
        .from("orders")
        .select("guest_email, status, created_at")
        .lt("created_at", fromIso);

      priorEmailSet = new Set(
        (priorRows || [])
          .filter((o) => isSalesStatus(o.status))
          .map((o) => String((o as { guest_email?: string }).guest_email || "").trim().toLowerCase())
          .filter(Boolean)
      );
    }

    const summary = summarizePeriod(periodOrders);
    const compareSummary = compareOrders.length
      ? summarizePeriod(compareOrders)
      : null;

    const growth = compareSummary
      ? {
          revenuePct: growthPct(
            summary.revenueAed,
            compareSummary.revenueAed
          ),
          ordersPct: growthPct(
            summary.salesOrdersCount,
            compareSummary.salesOrdersCount
          ),
          aovPct: growthPct(
            summary.averageOrderValue,
            compareSummary.averageOrderValue
          ),
        }
      : null;

    const funnel = funnelCounts(periodOrders);
    const funnelRevenue = funnelRevenueByStatus(periodOrders);

    const granularity =
      rangeDays === null || rangeDays > 92 ? "monthly" : "daily";
    const chartSeries = buildChartSeries(periodOrders, granularity);

    const monthlySalesTable = buildMonthlySales(periodOrders);

    const productPerformance = buildProductPerformance(periodOrders);
    const customers = customerInsights(periodOrders, priorEmailSet);

    let lifetimeSummary = summary;
    if (preset !== "all") {
      const { data: allRows } = await supabaseAdmin
        .from("orders")
        .select(ORDER_SELECT)
        .order("created_at", { ascending: false });
      lifetimeSummary = summarizePeriod((allRows || []) as RawOrderRow[]);
    }

    logApiCall(
      "GET",
      "/api/admin/analytics",
      200,
      {
        userId: authResult.user!.id,
        email: authResult.user!.email,
        ipAddress,
      },
      authResult.user!.id,
      ipAddress
    );

    return NextResponse.json({
      preset,
      range: {
        from: fromIso,
        to: toIso,
        label:
          preset === "all"
            ? "All time"
            : `${fromIso?.slice(0, 10) ?? "?"} → ${toIso.slice(0, 10)}`,
        days: rangeDays,
      },
      compareRange: compareRange
        ? {
            from: compareRange.from.toISOString(),
            to: compareRange.to.toISOString(),
          }
        : null,
      summary,
      compareSummary,
      growth,
      funnel,
      funnelRevenue,
      chartSeries,
      chartGranularity: granularity,
      monthlySales: monthlySalesTable,
      productPerformance,
      customers,
      lifetime: lifetimeSummary,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    const errObj = error instanceof Error ? error : new Error(String(error));
    logApiError("/api/admin/analytics", errObj, { ipAddress });
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
