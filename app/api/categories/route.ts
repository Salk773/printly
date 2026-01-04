// app/api/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/auth/adminAuth";
import {
  CategoryCreateSchema,
  CategoryDeleteSchema,
  validateRequest,
} from "@/lib/validation/schemas";

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function GET() {
  // GET is public - no auth required
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  // Require admin authentication
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return authResult.response;
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  // Validate input
  const validation = validateRequest(CategoryCreateSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: 400 }
    );
  }

  const admin = supabaseAdmin();
  const { error } = await admin.from("categories").insert({
    name: validation.data.name,
    slug: slugify(validation.data.name),
  });

  if (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  // Require admin authentication
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return authResult.response;
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  // Validate input
  const validation = validateRequest(CategoryDeleteSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: 400 }
    );
  }

  const admin = supabaseAdmin();
  const { error } = await admin.from("categories").delete().eq("id", validation.data.id);

  if (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
