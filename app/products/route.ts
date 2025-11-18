// app/api/products/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ---------- GET /api/products ----------
export async function GET() {
  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("products")
    .select("id, name, description, price, image_main, category_id")
    .order("name", { ascending: true });

  if (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, products: data ?? [] });
}

// ---------- POST /api/products ----------
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { name, description, price, image_main, category_id } = body;

    if (
      !name ||
      !image_main ||
      !category_id ||
      price === undefined ||
      price === null
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "name, price, image_main and category_id are required",
        },
        { status: 400 }
      );
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return NextResponse.json(
        { success: false, message: "Invalid price value" },
        { status: 400 }
      );
    }

    const admin = supabaseAdmin();

    const { error } = await admin.from("products").insert({
      name: String(name),
      description: description ? String(description) : "",
      price: numericPrice,
      image_main: String(image_main),
      category_id: String(category_id),
      active: true,
    });

    if (error) {
      console.error("Insert product error:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Product created" });
  } catch (e: any) {
    console.error("POST /api/products exception:", e);
    return NextResponse.json(
      { success: false, message: "Unexpected server error" },
      { status: 500 }
    );
  }
}

// ---------- PATCH /api/products ----------
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, message: "Missing 'id' in body" },
        { status: 400 }
      );
    }

    const { id, name, description, price, image_main, category_id } = body;

    const update: Record<string, any> = {};

    if (name !== undefined) update.name = String(name);
    if (description !== undefined) update.description = String(description ?? "");
    if (image_main !== undefined) update.image_main = String(image_main);
    if (category_id !== undefined) update.category_id = String(category_id);
    if (price !== undefined) {
      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return NextResponse.json(
          { success: false, message: "Invalid price value" },
          { status: 400 }
        );
      }
      update.price = numericPrice;
    }

    const admin = supabaseAdmin();
    const { error } = await admin.from("products").update(update).eq("id", id);

    if (error) {
      console.error("PATCH /api/products error:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Product updated" });
  } catch (e: any) {
    console.error("PATCH /api/products exception:", e);
    return NextResponse.json(
      { success: false, message: "Unexpected server error" },
      { status: 500 }
    );
  }
}

// ---------- DELETE /api/products?id=... ----------
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
  const { error } = await admin.from("products").delete().eq("id", id);

  if (error) {
    console.error("DELETE /api/products error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: "Product deleted" });
}
