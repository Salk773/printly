// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/auth/rateLimit";
import {
  ProductCreateSchema,
  ProductUpdateSchema,
  ProductDeleteSchema,
  validateRequest,
} from "@/lib/validation/schemas";
import { getErrorMessage } from "@/lib/errorMessage";

export const dynamic = "force-dynamic";

const OPTIONAL_PRODUCT_COLUMNS = [
  "featured",
  "stock_quantity",
  "low_stock_threshold",
  "weight_text",
  "dimensions_text",
] as const;

function isMissingProductColumnError(error: any, column: string) {
  const message = getErrorMessage(error, "").toLowerCase();
  const columnWords = column.toLowerCase().replace(/_/g, " ");
  return (
    (message.includes("schema cache") || error?.code === "PGRST204") &&
    (message.includes(column.toLowerCase()) || message.includes(columnWords))
  );
}

async function insertProductWithOptionalColumnFallback(payload: Record<string, unknown>) {
  const admin = supabaseAdmin();
  let insertPayload = { ...payload };
  let result = await admin.from("products").insert(insertPayload);

  for (const column of OPTIONAL_PRODUCT_COLUMNS) {
    if (result.error && isMissingProductColumnError(result.error, column)) {
      delete insertPayload[column];
      result = await admin.from("products").insert(insertPayload);
    }
  }

  return result;
}

async function updateProductWithOptionalColumnFallback(
  id: string,
  payload: Record<string, unknown>
) {
  const admin = supabaseAdmin();
  let updatePayload = { ...payload };
  let result = await admin.from("products").update(updatePayload).eq("id", id);

  for (const column of OPTIONAL_PRODUCT_COLUMNS) {
    if (result.error && isMissingProductColumnError(result.error, column)) {
      delete updatePayload[column];
      result = await admin.from("products").update(updatePayload).eq("id", id);
    }
  }

  return result;
}

export async function GET(req: NextRequest) {
  // Apply rate limiting for public endpoint
  const rateLimitResponse = rateLimitMiddleware(req, RATE_LIMITS.public);
  if (rateLimitResponse) return rateLimitResponse;

  // GET is public - no auth required
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  // Apply rate limiting for admin endpoint
  const rateLimitResponse = rateLimitMiddleware(req, RATE_LIMITS.admin);
  if (rateLimitResponse) return rateLimitResponse;

  // Require admin authentication
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return (authResult as { authorized: false; response: NextResponse }).response;
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  // Validate input
  const validation = validateRequest(ProductCreateSchema, body);
  if (validation.success === false) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: 400 }
    );
  }

  const { error } = await insertProductWithOptionalColumnFallback({
    name: validation.data.name,
    description: validation.data.description,
    weight_text: validation.data.weight_text || null,
    dimensions_text: validation.data.dimensions_text || null,
    price: validation.data.price,
    image_main: validation.data.image_main,
    category_id: validation.data.category_id,
    active: validation.data.active,
    featured: validation.data.featured,
  });

  if (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  // Apply rate limiting for admin endpoint
  const rateLimitResponse = rateLimitMiddleware(req, RATE_LIMITS.admin);
  if (rateLimitResponse) return rateLimitResponse;

  // Require admin authentication
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return (authResult as { authorized: false; response: NextResponse }).response;
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  // Validate input
  const validation = validateRequest(ProductDeleteSchema, body);
  if (validation.success === false) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: 400 }
    );
  }

  const admin = supabaseAdmin();
  const { error } = await admin.from("products").delete().eq("id", validation.data.id);

  if (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  // Apply rate limiting for admin endpoint
  const rateLimitResponse = rateLimitMiddleware(req, RATE_LIMITS.admin);
  if (rateLimitResponse) return rateLimitResponse;

  // Require admin authentication
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return (authResult as { authorized: false; response: NextResponse }).response;
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  // Validate input
  const validation = validateRequest(ProductUpdateSchema, body);
  if (validation.success === false) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: 400 }
    );
  }

  const { id, ...updateData } = validation.data;

  const { error } = await updateProductWithOptionalColumnFallback(id, updateData);

  if (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
