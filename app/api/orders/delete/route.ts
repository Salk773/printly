import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * API endpoint to delete an order
 * Uses service role key to bypass RLS policies
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Missing orderId" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // Verify order exists first
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Delete the order
    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message || "Failed to delete order" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully"
    });

  } catch (error: any) {
    console.error("Order delete error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

