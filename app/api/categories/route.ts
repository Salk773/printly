// app/api/categories/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function GET() {
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

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ ok: false }, { status: 400 });

  const admin = supabaseAdmin();
  const { error } = await admin.from("categories").insert({
    name: body.name,
    slug: slugify(body.name),
  });

  if (error) {
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ ok: false }, { status: 400 });

  const admin = supabaseAdmin();
  const { error } = await admin.from("categories").delete().eq("id", body.id);

  if (error) {
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
