// app/page.tsx
import Link from "next/link";
import Image from "next/image";
import { supabaseServer } from "@/lib/supabaseServer";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_main: string | null;
};

export default async function HomePage() {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, price, image_main")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(4);

  const products: Product[] = data ?? [];

  if (error) {
    console.error("Error loading featured products:", error.message);
  }

  return (
    <main>
      {/* HERO */}
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="hero-tag">3D printed in the UAE 🇦🇪</p>
            <h1 className="hero-title">
              Made <span className="hero-accent">layer by layer</span>.
            </h1>
            <p className="hero-subtitle">
              Browse ready-made 3D printed items or scale into custom parts — all
              printed locally with PLA+ and PETG.
            </p>
            <div className="hero-actions">
              <Link href="/products" className="btn btn-primary">
                Browse products
              </Link>
              <a href="mailto:contact@printly.ae" className="btn btn-secondary">
                Contact us
              </a>
            </div>
          </div>
          <div className="hero-card">
            <p className="hero-card-title">For makers & small brands</p>
            <p className="hero-card-text">
              Start with charms, décor, and useful everyday parts. Later, open the
              platform for custom uploads and B2B printing.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Featured products</h2>
            <Link href="/products" className="section-link">
              View all →
            </Link>
          </div>

          {products.length === 0 ? (
            <p className="muted">
              No products yet — add some from the admin panel to see them here.
            </p>
          ) : (
            <div className="grid">
              {products.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="card product-card"
                >
                  {p.image_main && (
                    <div className="product-image-wrap">
                      <Image
                        src={p.image_main}
                        alt={p.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}
                  <div className="product-body">
                    <h3>{p.name}</h3>
                    <p className="muted small">
                      {p.description || "3D printed product"}
                    </p>
                    <p className="price">
                      {p.price != null ? `${p.price.toFixed(2)} AED` : "TBD"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
