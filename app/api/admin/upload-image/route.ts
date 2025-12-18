export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const client = supabaseAdmin();

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { data: profile, error: profileErr } = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileErr) {
      console.error(profileErr);
      return NextResponse.json({ error: "Profile lookup failed" }, { status: 500 });
    }

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    // Convert to bytes explicitly (prevents 0-byte/invalid uploads)
    const ab = await file.arrayBuffer();
    if (!ab || ab.byteLength === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const filename = `${crypto.randomUUID()}.${ext}`;
    const path = `products/${filename}`;

    const { error: upErr } = await client.storage
      .from("uploads")
      .upload(path, new Uint8Array(ab), {
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
        upsert: false,
      });

    if (upErr) {
      console.error(upErr);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { data } = client.storage.from("uploads").getPublicUrl(path);

    return NextResponse.json({ url: data.publicUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
