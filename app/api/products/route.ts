import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Parse and sanitize query params
function getParams(req: Request) {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 12)));
  const q = (url.searchParams.get("q") || "").trim();
  const category = (url.searchParams.get("category") || "").trim();
  const sort = (url.searchParams.get("sort") || "created_at_desc").trim(); // price_asc | price_desc | created_at_asc | created_at_desc
  return { page, limit, q, category, sort };
}

export async function GET(req: Request) {
  try {
    const { page, limit, q, category, sort } = getParams(req);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("active", true);

    if (q) query = query.ilike("name", `%${q}%`);
    if (category) query = query.eq("category", category);

    // Sorting
    const [col, dir] =
      sort === "price_asc" ? ["price_aed", true] :
      sort === "price_desc" ? ["price_aed", false] :
      sort === "created_at_asc" ? ["created_at", true] :
      ["created_at", false];

    query = query.order(col, { ascending: dir });

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Products API error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Cache for 60s (safe for product listing) – tweak later if needed
    const res = NextResponse.json({ products: data ?? [], page, limit, total: count ?? 0 });
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res;
  } catch (err: any) {
    console.error("Products API unexpected error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

