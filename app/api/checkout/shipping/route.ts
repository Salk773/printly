import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("shipping_methods")
      .select("*")
      .eq("active", true)
      .order("cost", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch shipping methods" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, methods: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

