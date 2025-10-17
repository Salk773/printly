import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.from("products").select("id").limit(1);

    if (error) {
      console.error("Supabase error:", error);
      return new Response(JSON.stringify({ status: "fail", error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status: "ok", message: "Supabase connected ✅" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ status: "error", message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
