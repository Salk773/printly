import Link from "next/link";
import Image from "next/image";
import { supabaseServer } from "@/lib/supabaseServer";
import AddToCartButton from "@/components/AddToCartButton";
import HomepageCarousel from "@/components/HomepageCarousel";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = supabaseServer();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, price, image_main")
    .eq("active", true)
    .limit(4);

  const { data: galleryFiles } = await supabase.storage
    .from("uploads")
    .list("home-gallery", { sortBy: { column: "name", order: "asc" } });

  const galleryImages =
    galleryFiles?.map(
      (f) =>
        supabase.storage
          .from("uploads")
          .getPublicUrl(`home-gallery/${f.name}`).data.publicUrl
    ) ?? [];

  return (
    <>
      {/* Hero */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2.1fr)",
          gap: 32,
          marginTop: 32,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: "#9ca3af",
              marginBottom: 12,
            }}
          >
            UAE · 3D printing marketplace
          </div>

          <h1 style={{ fontSize: "2.8rem", lineHeight: 1.1 }}>
            Made <span style={{ color: "#c084fc" }}>layer by layer</span>.
          </h1>

          <p style={{ color: "#9ca3af", maxWidth: 520 }}>
            Browse ready-made 3D printed parts, decor, and tools from creators
            across the UAE.
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <Link href="/products" className="btn-primary">
              Browse Products
            </Link>
            <button className="btn-ghost">List your prints</button>
          </div>
        </div>

        <div className="card-soft" style={{ padding: 20 }}>
          <h3>How Printly works</h3>
          <p style={{ color: "#cbd5f5" }}>
            Curated ready-to-print designs in PLA+ and PETG.
          </p>
        </div>
      </section>

      {/* Announcement carousel */}
      {galleryImages.length > 0 && (
        <HomepageCarousel images={galleryImages} />
      )}

      {/* Featured products */}
      <section style={{ marginTop: 56 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h2>Featured products</h2>
          <Link href="/products" style={{ color: "#9ca3af" }}>
            View all →
          </Link>
        </div>

        <div className="grid grid-4">
          {products?.map((p) => (
            <div key={p.id} className="card">
              <Link href={`/products/${p.id}`}>
                <div style={{ position: "relative", height: 230 }}>
                  <Image
                    src={p.image_main}
                    alt={p.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
              </Link>

              <div style={{ padding: 14 }}>
                <strong>{p.name}</strong>
                <p style={{ color: "#9ca3af", fontSize: "0.8rem" }}>
                  {p.description}
                </p>
                <div>{p.price.toFixed(2)} AED</div>

                <AddToCartButton
                  id={p.id}
                  name={p.name}
                  price={p.price}
                  image={p.image_main}
                  small
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
