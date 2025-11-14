// app/api/categories/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Helper: Convert text → URL slug
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
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "Invalid request: 'name' is required" },
        { status: 400 }
      );
    }

    const admin = supabaseAdmin();

    const name = body.name.trim();
    let slug = body.slug?.trim() || toSlug(name);

    // Ensure slug is unique
    let finalSlug = slug;
    let counter = 1;

    while (true) {
      const { data: exists } = await admin
        .from("categories")
        .select("id")
        .eq("slug", finalSlug)
        .maybeSingle();

      if (!exists) break;

      finalSlug = `${slug}-${counter++}`;
    }

    // Insert category
    const { data, error } = await admin
      .from("categories")
      .insert([{ name, slug: finalSlug }])
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, category: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET /api/categories
export async function GET() {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("categories")
    .select("id, name, slug")
    .order("name");

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
