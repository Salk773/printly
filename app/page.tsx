import Link from "next/link";
import Image from "next/image";
import { supabaseServer } from "@/lib/supabaseServer";
import HomepageCarousel from "@/components/HomepageCarousel";
import FeaturedProductsGrid from "@/components/FeaturedProductsGrid";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = supabaseServer();

  // Fetch featured products - fallback to regular products if featured column doesn't exist
  let productsQuery = supabase
    .from("products")
    .select("id, name, description, price, image_main, featured")
    .eq("active", true)
    .eq("featured", true)
    .limit(4);

  let { data: products, error } = await productsQuery;

  // If featured column doesn't exist, fallback to regular products
  if (error && (error.message?.includes("featured") || error.code === "PGRST204")) {
    const fallbackQuery = await supabase
      .from("products")
      .select("id, name, description, price, image_main")
      .eq("active", true)
      .limit(4);
    // Map fallback data to include featured field (set to false)
    products = fallbackQuery.data?.map((p) => ({ ...p, featured: false })) || null;
  }

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
        className="hero-section"
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

          <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
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
      <section style={{ marginTop: 56 }} className="featured-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h2>Featured products</h2>
          <Link href="/products" style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
            View all →
          </Link>
        </div>

        {products && products.length > 0 ? (
          <FeaturedProductsGrid products={products} />
        ) : (
          <p style={{ color: "#9ca3af", textAlign: "center", padding: 40 }}>
            No featured products available. Mark products as featured in the admin panel to display them here.
          </p>
        )}
      </section>
    </>
  );
}
