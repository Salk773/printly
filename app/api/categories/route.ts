// app/api/categories/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

// Simple helper to make a URL-safe slug
function toSlug(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

// POST /api/categories
// Body: { name: string, slug?: string }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { status: "error", message: "Invalid request: 'name' is required" },
        { status: 400 }
      );
    }

    const name: string = body.name.trim();
    let slug: string = (body.slug?.trim() || toSlug(name)) as string;

    // Ensure slug uniqueness by appending a suffix if needed
    const admin = supabaseAdmin();

    // Check if slug exists
    const { data: existing } = await admin
      .from("categories")
      .select("id, slug")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-6)}`;
    }

    const { data, error } = await admin
      .from("categories")
      .insert([{ name, slug }])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { status: "ok", category: data },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}

// Optional: GET /api/categories — list all categories (admin-powered to avoid RLS issues in some setups)
export async function GET() {
  try {
    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("categories")
      .select("id, name, slug")
      .order("name");

    if (error) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ status: "ok", categories: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
