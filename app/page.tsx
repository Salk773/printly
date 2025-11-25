import Link from "next/link";
import Image from "next/image";
import { supabaseServer } from "@/lib/supabaseServer";

export const revalidate = 60; // ISR

export default async function HomePage() {
  const supabase = supabaseServer();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, price, image_main")
    .eq("active", true)
    .limit(4);

  return (
    <>
      {/* Hero */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2.1fr)",
          gap: 32,
          marginTop: 32,
          alignItems: "center"
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: "#9ca3af",
              marginBottom: 12
            }}
          >
            UAE · 3D printing marketplace
          </div>

          <h1
            style={{
              fontSize: "2.8rem",
              lineHeight: 1.1,
              margin: 0,
              marginBottom: 12
            }}
          >
            Made <span style={{ color: "#c084fc" }}>layer by layer</span>.
          </h1>

          <p
            style={{
              color: "#9ca3af",
              maxWidth: 520,
              fontSize: "0.98rem",
              lineHeight: 1.6
            }}
          >
            Browse ready-made 3D printed parts, decor, and useful tools from
            creators across the UAE. Custom prints coming soon.
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <Link href="/products" className="btn-primary">
              Browse Products
            </Link>
            <button className="btn-ghost" style={{ fontSize: "0.85rem" }}>
              List your prints
            </button>
          </div>
        </div>

        <div className="card-soft" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 4, marginBottom: 10, fontSize: "1rem" }}>
            How Printly works
          </h3>
          <p
            style={{
              fontSize: "0.9rem",
              color: "#cbd5f5",
              marginBottom: 8
            }}
          >
            We start with curated, ready-to-print designs in PLA+ and PETG.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
            Later, you&apos;ll be able to upload your own models and choose
            colours, materials, and print settings — all printed locally for
            faster turnaround across the UAE.
          </p>
        </div>
      </section>

      {/* Featured products */}
      <section style={{ marginTop: 48 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 16
          }}
        >
          <h2 style={{ fontSize: "1.2rem" }}>Featured products</h2>
          <Link
            href="/products"
            style={{ fontSize: "0.85rem", color: "#9ca3af" }}
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-4">
          {products?.map(p => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="card"
              style={{ overflow: "hidden" }}
            >
              <div style={{ position: "relative", height: 230 }}>
                {p.image_main && (
                  <Image
                    src={p.image_main}
                    alt={p.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                )}
              </div>
              <div style={{ padding: 14 }}>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    marginBottom: 4
                  }}
                >
                  {p.name}
                </div>
                <p
                  style={{
                    color: "#9ca3af",
                    fontSize: "0.8rem",
                    minHeight: 32
                  }}
                >
                  {p.description}
                </p>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: "0.85rem",
                    fontWeight: 600
                  }}
                >
                  {p.price.toFixed(2)} AED
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
