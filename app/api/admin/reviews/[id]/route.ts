import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ReviewVisibleSchema, validateRequest } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

const uuidSchema = z.string().uuid();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
  if (auth.authorized === false) return auth.response;

  const idParsed = uuidSchema.safeParse(params.id);
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = validateRequest(ReviewVisibleSchema, body);
  if (parsed.success === false) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("reviews")
    .update({ visible: parsed.data.visible })
    .eq("id", idParsed.data)
    .select("id, visible")
    .maybeSingle();

  if (error) {
    console.error("admin review patch:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  return NextResponse.json({ review: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
  if (auth.authorized === false) return auth.response;

  const idParsed = uuidSchema.safeParse(params.id);
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { error } = await admin.from("reviews").delete().eq("id", idParsed.data);

  if (error) {
    console.error("admin review delete:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
