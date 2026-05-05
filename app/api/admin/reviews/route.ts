import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reviews — all reviews with product name (admin only)
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.authorized === false) return auth.response;

  const admin = supabaseAdmin();
  const { data: rows, error } = await admin
    .from("reviews")
    .select("id, product_id, user_id, rating, comment, visible, created_at, updated_at, products(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("admin reviews list:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = rows ?? [];
  const userIds = [...new Set(list.map((r) => r.user_id).filter(Boolean))];
  const emailMap = new Map<string, string>();

  await Promise.all(
    userIds.map(async (uid) => {
      try {
        const { data, error: userErr } = await admin.auth.admin.getUserById(uid);
        if (!userErr && data?.user?.email) {
          emailMap.set(uid, data.user.email);
        }
      } catch {
        /* ignore */
      }
    })
  );

  const reviews = list.map((r: Record<string, unknown>) => {
    const rel = r.products as { name?: string } | { name?: string }[] | null | undefined;
    const productName =
      Array.isArray(rel) ? rel[0]?.name ?? null : rel && typeof rel === "object" ? rel.name ?? null : null;
    return {
      id: r.id,
      product_id: r.product_id,
      user_id: r.user_id,
      rating: r.rating,
      comment: r.comment,
      visible: r.visible !== false,
      created_at: r.created_at,
      updated_at: r.updated_at,
      product_name: productName,
      user_email: emailMap.get(String(r.user_id)) ?? null,
    };
  });

  return NextResponse.json({ reviews });
}
