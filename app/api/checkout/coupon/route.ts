import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { validateCouponForSubtotal } from "@/lib/checkoutCoupon";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, subtotal, total } = body;

    const cartSubtotal =
      typeof subtotal === "number"
        ? subtotal
        : typeof total === "number"
          ? total
          : NaN;

    if (!Number.isFinite(cartSubtotal) || cartSubtotal < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Product subtotal is required (shipping is not discounted)",
        },
        { status: 400 }
      );
    }

    const result = await validateCouponForSubtotal(String(code || ""), cartSubtotal);
    if (result.ok === false) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      coupon: {
        code: result.codeNormalized,
        discount_type: result.discountType,
        discount_amount: result.discountAed,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
