import Link from "next/link";
import Image from "next/image";
import { supabaseServer } from "../lib/supabaseServer";

export default async function HomePage() {
  const supabase = supabaseServer();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, description, base_price, image_main, active")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(4);

  if (error) {
    console.error(error);
  }

  return (
    <main>
      {/* HERO */}
      <section className="hero">
        <div className="container">
          <h1 style={{ fontSize: "3rem", fontWeight: 800, margin: 0 }}>
            Made <span style={{ color: "var(--accent)" }}>Layer by Layer</span>.
          </h1>
          <p style={{ color: "var(--muted)", marginTop: 10, fontSize: "1.1rem" }}>
            UAE’s first 3D printing marketplace — from creators, for creators.
          </p>
          <div style={{ marginTop: 24 }}>
            <Link href="/products" className="btn">
              Explore Products
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section style={{ padding: "48px 0" }}>
        <div className="container">
          <h2
            style={{
              fontSize: "1.6rem",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Featured Products
          </h2>

          <div className="grid">
            {products?.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="card"
                style={{ padding: 16 }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "4/3",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={p.image_main || "/placeholder.png"}
                    alt={p.name}
                    fill
                    sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
                    priority={false}
                    style={{ objectFit: "cover" }}
                  />
                </div>

                <h3
                  style={{
                    marginTop: 12,
                    marginBottom: 6,
                    color: "var(--accent)",
                  }}
                >
                  {p.name}
                </h3>
                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: ".95rem",
                    margin: 0,
                  }}
                >
                  {p.description}
                </p>
                <p style={{ marginTop: 8, fontWeight: 700 }}>
                  AED {p.base_price?.toFixed(2)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
