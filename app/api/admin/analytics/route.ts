import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { verifyAdmin } from "@/lib/auth/adminAuth";
import { logApiCall, logApiError } from "@/lib/logger";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[] | null;
}

interface MonthlySales {
  month: string;
  year: number;
  total: number;
  orderCount: number;
}

interface ProductPerformance {
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

function toFiniteNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

function isValidOrderItem(item: unknown): item is OrderItem {
  if (!item || typeof item !== "object") return false;
  const candidate = item as Partial<OrderItem>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.price === "number" &&
    typeof candidate.quantity === "number"
  );
}

export async function GET(req: NextRequest) {
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  
  try {
    // #region agent log
    fetch("http://127.0.0.1:7557/ingest/4c85b0d5-d993-424a-bae9-0fea9b6fa259",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"f31495"},body:JSON.stringify({sessionId:"f31495",runId:"debug-2",hypothesisId:"A4",location:"app/api/admin/analytics/route.ts:entry",message:"Analytics API entry",data:{},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const authResult = await verifyAdmin(req);

    if (!authResult.authorized) {
      const statusCode = authResult.error?.includes("not an admin") ? 403 : 401;
      logApiCall("GET", "/api/admin/analytics", statusCode, { 
        error: authResult.error,
        ipAddress 
      }, undefined, ipAddress);
      return NextResponse.json(
        { error: authResult.error },
        { status: statusCode }
      );
    }

    // Use admin client to access orders
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Fetch all orders (excluding cancelled ones for sales calculations)
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("id, total, status, created_at, items")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const ordersData = (orders || []) as Order[];

    // Calculate lifetime sales (exclude cancelled orders)
    const lifetimeSales = ordersData
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, order) => sum + toFiniteNumber(order.total), 0);

    // Calculate monthly sales
    const monthlySalesMap = new Map<string, MonthlySales>();
    
    ordersData
      .filter((o) => o.status !== "cancelled")
      .forEach((order) => {
        const date = new Date(order.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthName = date.toLocaleString("default", { month: "long" });
        
        if (!monthlySalesMap.has(monthKey)) {
          monthlySalesMap.set(monthKey, {
            month: monthName,
            year: date.getFullYear(),
            total: 0,
            orderCount: 0,
          });
        }
        
        const monthlyData = monthlySalesMap.get(monthKey)!;
        monthlyData.total += toFiniteNumber(order.total);
        monthlyData.orderCount += 1;
      });

    const monthlySales = Array.from(monthlySalesMap.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.key.localeCompare(a.key))
      .map(({ key, ...value }) => value);

    // Calculate product performance
    const productMap = new Map<string, ProductPerformance>();
    
    ordersData
      .filter((o) => o.status !== "cancelled")
      .forEach((order) => {
        if (!order.items || !Array.isArray(order.items)) return;

        order.items.filter(isValidOrderItem).forEach((item) => {
          if (!productMap.has(item.name)) {
            productMap.set(item.name, {
              name: item.name,
              totalQuantity: 0,
              totalRevenue: 0,
              orderCount: 0,
            });
          }
          
          const productData = productMap.get(item.name)!;
          productData.totalQuantity += toFiniteNumber(item.quantity);
          productData.totalRevenue += toFiniteNumber(item.price) * toFiniteNumber(item.quantity);
          productData.orderCount += 1;
        });
      });

    const productPerformance = Array.from(productMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    logApiCall("GET", "/api/admin/analytics", 200, {
      userId: authResult.user!.id,
      email: authResult.user!.email,
      ipAddress,
    }, authResult.user!.id, ipAddress);

    return NextResponse.json({
      lifetimeSales,
      monthlySales,
      productPerformance,
      totalOrders: ordersData.length,
      activeOrders: ordersData.filter((o) => o.status !== "cancelled").length,
    });
  } catch (error: any) {
    // #region agent log
    fetch("http://127.0.0.1:7557/ingest/4c85b0d5-d993-424a-bae9-0fea9b6fa259",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"f31495"},body:JSON.stringify({sessionId:"f31495",runId:"debug-2",hypothesisId:"A5",location:"app/api/admin/analytics/route.ts:catch",message:"Analytics API catch",data:{errorMessage:error?.message||"unknown"},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    logApiError("/api/admin/analytics", error, { ipAddress });
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

