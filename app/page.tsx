import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function HomePage() {
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .limit(4);

  return (
    <main style={{ padding: "60px 20px", textAlign: "center" }}>
      <section style={{ padding: "100px 20px" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 700 }}>
          Made <span style={{ color: "#c084fc" }}>Layer by Layer</span>.
        </h1>
        <p style={{ color: "#ccc", marginTop: "10px", fontSize: "1.2rem" }}>
          UAE’s first 3D printing marketplace — from creators, for creators.
        </p>
        <Link
          href="/products"
          style={{
            display: "inline-block",
            marginTop: "30px",
            padding: "12px 28px",
            backgroundColor: "#c084fc",
            color: "#000",
            fontWeight: 600,
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          Browse Products
        </Link>
      </section>

      <section style={{ marginTop: "60px" }}>
        <h2>Featured Products</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            marginTop: "30px",
          }}
        >
          {products?.map((p) => (
            <div
              key={p.id}
              style={{
                background: "#111",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid #222",
              }}
            >
              <h3>{p.name}</h3>
              <p style={{ color: "#aaa" }}>{p.description}</p>
              <p style={{ color: "#c084fc", fontWeight: 600 }}>{p.price} AED</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
