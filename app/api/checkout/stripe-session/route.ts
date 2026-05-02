import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";
import { getStripe, siteUrl } from "@/lib/stripe";
import { validateCheckoutForm, sanitizeInput } from "@/lib/validation";
import { logApiCall, logApiError } from "@/lib/logger";
import { CHECKOUT_SHIPPING_AED } from "@/lib/checkoutShipping";

export const dynamic = "force-dynamic";

type CartLine = { id: string; quantity: number };

export async function POST(req: NextRequest) {
  try {
    logApiCall("POST", "/api/checkout/stripe-session");

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { success: false, error: "Stripe is not configured" },
        { status: 503 }
      );
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "") || null;

    const supabaseAuth = supabaseServer();
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userName: string | null = null;

    if (token) {
      const {
        data: { user },
      } = await supabaseAuth.auth.getUser(token);
      if (user) {
        userId = user.id;
        userEmail = user.email ?? null;
        userName =
          (user.user_metadata?.full_name as string | undefined) ||
          user.email?.split("@")[0] ||
          null;
      }
    }

    const body = await req.json();
    const {
      items: rawItems,
      notes,
      saved_address_id,
      guest_email,
      guest_name,
      phone,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
    } = body;

    const items = rawItems as CartLine[] | undefined;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty" },
        { status: 400 }
      );
    }

    const validation = validateCheckoutForm({
      email: userId ? undefined : guest_email,
      name: userId ? undefined : guest_name,
      phone: phone || "",
      address1: address_line_1 || "",
      city: city || "",
      state: state || "",
      postalCode: postal_code,
      isGuest: !userId,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join("; ") },
        { status: 400 }
      );
    }

    const admin = supabaseAdmin();

    if (saved_address_id) {
      if (!userId) {
        return NextResponse.json(
          { success: false, error: "Saved addresses require a signed-in account" },
          { status: 400 }
        );
      }
      const { data: addr, error: addrErr } = await admin
        .from("saved_addresses")
        .select("id")
        .eq("id", saved_address_id)
        .eq("user_id", userId)
        .maybeSingle();

      if (addrErr || !addr) {
        return NextResponse.json(
          { success: false, error: "Invalid saved address" },
          { status: 400 }
        );
      }
    }

    const productIds = [...new Set(items.map((i) => i.id))];
    const { data: products, error: prodErr } = await admin
      .from("products")
      .select("id, name, price, image_main, active")
      .in("id", productIds);

    if (prodErr || !products?.length) {
      logApiError("/api/checkout/stripe-session", new Error(prodErr?.message || "Products lookup failed"));
      return NextResponse.json(
        { success: false, error: "Could not load products for checkout" },
        { status: 400 }
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    const lineItems: {
      price_data: {
        currency: string;
        unit_amount: number;
        product_data: { name: string; images?: string[] };
      };
      quantity: number;
    }[] = [];

    let computedTotal = 0;
    const orderItemsJson: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      image: string;
    }> = [];

    const baseUrl = siteUrl();

    for (const line of items) {
      const q = Math.min(Math.max(1, Math.floor(Number(line.quantity))), 999);
      const product = productMap.get(line.id);
      if (!product || !product.active) {
        return NextResponse.json(
          { success: false, error: `Product unavailable: ${line.id}` },
          { status: 400 }
        );
      }
      const unit = Number(product.price);
      if (!Number.isFinite(unit) || unit < 0) {
        return NextResponse.json(
          { success: false, error: "Invalid product price" },
          { status: 400 }
        );
      }
      const amountMinor = Math.round(unit * 100);
      computedTotal += unit * q;

      const img = product.image_main || "";
      const relativeOrAbsolute =
        img.startsWith("http") ? img : `${baseUrl}${img.startsWith("/") ? "" : "/"}${img}`;
      const imageForStripe =
        relativeOrAbsolute.startsWith("https://") ? relativeOrAbsolute : undefined;

      orderItemsJson.push({
        id: product.id,
        name: product.name,
        price: unit,
        quantity: q,
        image: img,
      });

      lineItems.push({
        price_data: {
          currency: "aed",
          unit_amount: amountMinor,
          product_data: {
            name: product.name,
            ...(imageForStripe ? { images: [imageForStripe] } : {}),
          },
        },
        quantity: q,
      });
    }

    const shippingMinor = Math.round(CHECKOUT_SHIPPING_AED * 100);
    computedTotal += CHECKOUT_SHIPPING_AED;
    lineItems.push({
      price_data: {
        currency: "aed",
        unit_amount: shippingMinor,
        product_data: {
          name: "Shipping",
          description: "Standard delivery",
        },
      },
      quantity: 1,
    });

    const customerEmail = userEmail || String(guest_email || "").trim();
    const customerName =
      userName ||
      (guest_name ? sanitizeInput(String(guest_name)) : null) ||
      customerEmail.split("@")[0];

    const orderPayload = {
      user_id: userId,
      guest_name: customerName,
      guest_email: customerEmail,
      phone: sanitizeInput(String(phone)),
      address_line_1: sanitizeInput(String(address_line_1)),
      address_line_2: address_line_2 ? sanitizeInput(String(address_line_2)) : null,
      city: sanitizeInput(String(city)),
      state: sanitizeInput(String(state)),
      postal_code: postal_code ? sanitizeInput(String(postal_code)) : null,
      items: orderItemsJson,
      total: Math.round(computedTotal * 100) / 100,
      shipping_cost: CHECKOUT_SHIPPING_AED,
      status: "pending",
      notes: notes ? sanitizeInput(String(notes)) : null,
      saved_address_id: saved_address_id || null,
    };

    const { data: orderRow, error: insertErr } = await admin
      .from("orders")
      .insert(orderPayload)
      .select("id, order_number")
      .single();

    if (insertErr || !orderRow) {
      logApiError("/api/checkout/stripe-session", new Error(insertErr?.message || "Insert failed"));
      return NextResponse.json(
        { success: false, error: "Failed to create order" },
        { status: 500 }
      );
    }

    const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/checkout`;

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: lineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: orderRow.id,
        metadata: {
          order_id: orderRow.id,
        },
        payment_intent_data: {
          metadata: {
            order_id: orderRow.id,
          },
        },
        customer_email: customerEmail,
        // Card + Link; Apple Pay / Google Pay show on Stripe’s page when the customer’s device supports them.
        payment_method_types: ["card", "link"],
      });
    } catch (e) {
      await admin.from("orders").delete().eq("id", orderRow.id);
      logApiError("/api/checkout/stripe-session", e instanceof Error ? e : new Error(String(e)));
      return NextResponse.json(
        { success: false, error: "Could not start payment session" },
        { status: 500 }
      );
    }

    await admin
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", orderRow.id);

    if (!session.url) {
      return NextResponse.json(
        { success: false, error: "No checkout URL returned" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: session.url,
      orderId: orderRow.id,
    });
  } catch (error: unknown) {
    logApiError(
      "/api/checkout/stripe-session",
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
