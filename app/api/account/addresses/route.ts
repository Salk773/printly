import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { supabaseServer } from "@/lib/supabaseServer";
import { logApiCall, logApiError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    logApiCall("GET", "/api/account/addresses");

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = supabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("saved_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      logApiError("GET", "/api/account/addresses", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch addresses" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, addresses: data || [] });
  } catch (error: any) {
    logApiError("GET", "/api/account/addresses", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    logApiCall("POST", "/api/account/addresses");

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = supabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      label,
      phone,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      is_default,
    } = body;

    if (!label || !address_line_1 || !city || !state) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: label, address_line_1, city, state",
        },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from("saved_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    const { data, error } = await supabase
      .from("saved_addresses")
      .insert({
        user_id: user.id,
        label,
        phone,
        address_line_1,
        address_line_2: address_line_2 || null,
        city,
        state,
        postal_code: postal_code || null,
        is_default: is_default || false,
      })
      .select()
      .single();

    if (error) {
      logApiError("POST", "/api/account/addresses", error);
      return NextResponse.json(
        { success: false, error: "Failed to create address" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, address: data });
  } catch (error: any) {
    logApiError("POST", "/api/account/addresses", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    logApiCall("PUT", "/api/account/addresses");

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = supabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      id,
      label,
      phone,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      is_default,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Address ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from("saved_addresses")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from("saved_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .neq("id", id);
    }

    const updateData: any = {};
    if (label !== undefined) updateData.label = label;
    if (phone !== undefined) updateData.phone = phone;
    if (address_line_1 !== undefined) updateData.address_line_1 = address_line_1;
    if (address_line_2 !== undefined) updateData.address_line_2 = address_line_2;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (postal_code !== undefined) updateData.postal_code = postal_code;
    if (is_default !== undefined) updateData.is_default = is_default;

    const { data, error } = await supabase
      .from("saved_addresses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logApiError("PUT", "/api/account/addresses", error);
      return NextResponse.json(
        { success: false, error: "Failed to update address" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, address: data });
  } catch (error: any) {
    logApiError("PUT", "/api/account/addresses", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    logApiCall("DELETE", "/api/account/addresses");

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = supabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Address ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from("saved_addresses")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("saved_addresses")
      .delete()
      .eq("id", id);

    if (error) {
      logApiError("DELETE", "/api/account/addresses", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete address" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logApiError("DELETE", "/api/account/addresses", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

