import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";
import { getStripe, siteUrl } from "@/lib/stripe";
import { validateCheckoutForm, sanitizeInput } from "@/lib/validation";
import { logApiCall, logApiError } from "@/lib/logger";
import { CHECKOUT_SHIPPING_AED } from "@/lib/checkoutShipping";
import { validateCouponForSubtotal } from "@/lib/checkoutCoupon";
import { applyDiscountMinorToProductLineItems } from "@/lib/stripeProductLineDiscount";

export const dynamic = "force-dynamic";

type CartLine = { id: string; quantity: number };

type OrderInsertPayload = Record<string, unknown>;

/** Full insert; retries without columns that often break older DBs (migrations not applied). */
async function insertPendingOrder(
  admin: ReturnType<typeof supabaseAdmin>,
  fullPayload: OrderInsertPayload
): Promise<{ data: { id: string; order_number: string | null } | null; error: { message: string } | null }> {
  const slimPayload = { ...fullPayload };
  delete slimPayload.shipping_cost;
  delete slimPayload.saved_address_id;
  delete slimPayload.discount_amount;
  delete slimPayload.coupon_code;

  const attempts = [fullPayload, slimPayload];

  let lastError: { message: string } | null = null;

  for (const payload of attempts) {
    const { data, error } = await admin
      .from("orders")
      .insert(payload)
      .select("id, order_number")
      .single();

    if (!error && data) {
      return { data, error: null };
    }
    lastError = error;
  }

  return { data: null, error: lastError };
}

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
      coupon_code: rawCouponCode,
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

    let productSubtotal = 0;
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
      productSubtotal += unit * q;

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

    let discountAed = 0;
    let couponCodeStored: string | null = null;
    const trimmedCoupon =
      typeof rawCouponCode === "string" ? rawCouponCode.trim() : "";
    if (trimmedCoupon) {
      const couponResult = await validateCouponForSubtotal(trimmedCoupon, productSubtotal);
      if (couponResult.ok === false) {
        return NextResponse.json(
          { success: false, error: couponResult.error },
          { status: 400 }
        );
      }
      discountAed = couponResult.discountAed;
      couponCodeStored = couponResult.codeNormalized;
      applyDiscountMinorToProductLineItems(
        lineItems,
        Math.round(discountAed * 100)
      );
    }

    const shippingMinor = Math.round(CHECKOUT_SHIPPING_AED * 100);
    const productsMinorSum = lineItems.reduce(
      (s, li) => s + li.price_data.unit_amount * li.quantity,
      0
    );
    const productTotalAfterDiscount = productsMinorSum / 100;
    const orderTotalAed =
      Math.round((productTotalAfterDiscount + CHECKOUT_SHIPPING_AED) * 100) / 100;

    lineItems.push({
      price_data: {
        currency: "aed",
        unit_amount: shippingMinor,
        product_data: {
          name: "Shipping (standard delivery)",
        },
      },
      quantity: 1,
    });

    const customerEmail = userEmail || String(guest_email || "").trim();
    const customerName =
      userName ||
      (guest_name ? sanitizeInput(String(guest_name)) : null) ||
      customerEmail.split("@")[0];

    const savedIdRaw = saved_address_id ? String(saved_address_id).trim() : "";
    const savedAddressId = savedIdRaw.length > 0 ? savedIdRaw : null;

    const orderPayload: OrderInsertPayload = {
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
      total: orderTotalAed,
      shipping_cost: CHECKOUT_SHIPPING_AED,
      discount_amount: discountAed,
      coupon_code: couponCodeStored,
      status: "pending",
      notes: notes ? sanitizeInput(String(notes)) : null,
      saved_address_id: savedAddressId,
    };

    const { data: orderRow, error: insertErr } = await insertPendingOrder(admin, orderPayload);

    if (insertErr || !orderRow) {
      const detail = insertErr?.message || "Insert failed";
      logApiError("/api/checkout/stripe-session", new Error(detail));
      const hint =
        /shipping_cost|saved_address|column|schema/i.test(detail) ||
        detail.includes("42703") ||
        detail.includes("PGRST")
          ? " If this persists, run Supabase migrations for `orders` (shipping + saved_address columns)."
          : "";
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create order.${hint}`,
          detail,
        },
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
