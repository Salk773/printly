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

  // Fetch banner content
  let bannerTitle = "How Printly works";
  let bannerDescription = "Curated ready-to-print designs in PLA+ and PETG.";
  
  try {
    const { data: bannerData, error: bannerError } = await supabase.storage
      .from("uploads")
      .download("config/homepage-banner-config.json");

    if (!bannerError && bannerData) {
      const text = await bannerData.text();
      const config = JSON.parse(text);
      bannerTitle = config.title || bannerTitle;
      bannerDescription = config.description || bannerDescription;
    }
  } catch (error) {
    // Use default values if config doesn't exist or error occurs
    console.error("Error loading banner config:", error);
  }

  return (
    <>
      {/* Hero */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2.1fr)",
          gap: 40,
          marginTop: 40,
          alignItems: "center",
          marginBottom: 60,
        }}
        className="hero-section"
      >
        <div>
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#94a3b8",
              marginBottom: 16,
              fontWeight: 600,
            }}
          >
            🇦🇪 UAE · Premium 3D Printing Marketplace
          </div>

          <h1 style={{ fontSize: "3.2rem", lineHeight: 1.1, fontWeight: 800, marginBottom: 20, letterSpacing: "-0.02em" }}>
            Made <span style={{ background: "linear-gradient(135deg, #c084fc, #a855f7)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}>layer by layer</span>.
          </h1>

          <p style={{ color: "#94a3b8", maxWidth: 560, fontSize: "1.1rem", lineHeight: 1.7, marginBottom: 32 }}>
            Discover unique 3D printed products, custom designs, and premium parts crafted by talented creators across the UAE.
          </p>

          <div style={{ display: "flex", gap: 16, marginTop: 32, flexWrap: "wrap", alignItems: "center" }}>
            <Link href="/products" className="btn-primary" style={{ fontSize: "1rem", padding: "12px 24px" }}>
              🛍️ Shop Now
            </Link>
            <a href="mailto:info@printly.ae" className="btn-ghost" style={{ fontSize: "0.95rem", padding: "12px 24px" }}>
              Become a Seller
            </a>
          </div>

          {/* Trust badges */}
          <div style={{ display: "flex", gap: 32, marginTop: 40, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "1.5rem" }}>✓</span>
              <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Fast Shipping</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "1.5rem" }}>✓</span>
              <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Secure Checkout</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "1.5rem" }}>✓</span>
              <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Quality Guaranteed</span>
            </div>
          </div>
        </div>

        <div className="card-soft" style={{ padding: 32, background: "linear-gradient(135deg, rgba(192,132,252,0.1), rgba(168,85,247,0.05))", border: "1px solid rgba(192,132,252,0.2)" }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: 12, fontWeight: 700 }}>{bannerTitle}</h3>
          <p style={{ color: "#cbd5e1", lineHeight: 1.6, fontSize: "1rem" }}>
            {bannerDescription}
          </p>
        </div>
      </section>

      {/* Announcement carousel */}
      {galleryImages.length > 0 && (
        <HomepageCarousel images={galleryImages} />
      )}

      {/* Featured products */}
      <section style={{ marginTop: 80 }} className="featured-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 24,
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 8 }}>Featured Products</h2>
            <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>Handpicked favorites from our collection</p>
          </div>
          <Link href="/products" style={{ color: "#c084fc", fontSize: "0.95rem", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
            View all <span>→</span>
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
