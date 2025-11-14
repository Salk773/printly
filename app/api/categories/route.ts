// app/api/categories/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Helper – turn a name into a URL-safe slug
function toSlug(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

// ---------- GET /api/categories ----------
export async function GET() {
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, categories: data ?? [] });
}

// ---------- POST /api/categories ----------
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { success: false, message: "Invalid request: 'name' is required" },
        { status: 400 }
      );
    }

    const name: string = body.name.trim();
    let baseSlug: string = (body.slug?.trim() as string) || toSlug(name);
    if (!baseSlug) baseSlug = toSlug(name);

    const admin = supabaseAdmin();

    // Ensure slug is unique by appending -2, -3, ... if needed
    let slug = baseSlug;
    let counter = 2;

    while (true) {
      const { data: existing, error: slugErr } = await admin
        .from("categories")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (slugErr) {
        console.error("Slug check error:", slugErr);
        return NextResponse.json(
          { success: false, message: slugErr.message },
          { status: 500 }
        );
      }

      if (!existing) break; // unique found
      slug = `${baseSlug}-${counter++}`;
    }

    const { error } = await admin.from("categories").insert({
      name,
      slug,
    });

    if (error) {
      console.error("Insert category error:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Category created" });
  } catch (e: any) {
    console.error("POST /api/categories exception:", e);
    return NextResponse.json(
      { success: false, message: "Unexpected server error" },
      { status: 500 }
    );
  }
}

// ---------- DELETE /api/categories?id=... ----------
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, message: "Missing 'id' query parameter" },
      { status: 400 }
    );
  }

  const admin = supabaseAdmin();
  const { error } = await admin.from("categories").delete().eq("id", id);

  if (error) {
    console.error("DELETE /api/categories error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: "Category deleted" });
}
