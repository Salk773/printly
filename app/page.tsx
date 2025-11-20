// app/page.tsx
import Link from "next/link";
import Image from "next/image";
import { supabaseServer } from "@/lib/supabaseServer";

export const revalidate = 0;

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_main: string | null;
}

export default async function HomePage() {
  const supabase = supabaseServer();

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(4);

  const products = (data ?? []) as Product[];

  return (
    <main>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="hero-tag">UAE · 3D printing marketplace</p>
            <h1 className="hero-title">
              Made <span className="hero-accent">layer by layer</span>.
            </h1>
            <p className="hero-subtitle">
              Browse ready-made 3D printed parts, decor, and useful tools from
              creators across the UAE. Custom prints coming soon.
            </p>
            <div className="hero-actions">
              <Link href="/products" className="btn btn-primary">
                Browse Products
              </Link>
              <Link href="mailto:contact@printly.ae" className="btn btn-secondary">
                List your prints
              </Link>
            </div>
          </div>

          <div className="hero-card">
            <h3 className="hero-card-title">How Printly works</h3>
            <p className="hero-card-text">
              We start with curated, ready-to-print designs in PLA+ and PETG.
              Later, you&apos;ll be able to upload your own models and choose
              colours, materials, and print settings.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Featured products</h2>
            <Link href="/products" className="section-link">
              View all →
            </Link>
          </div>

          {products.length === 0 ? (
            <p className="muted">No products yet. Add some in the admin panel.</p>
          ) : (
            <div className="grid">
              {products.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="card product-card"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {p.image_main && (
                    <div className="product-image-wrap">
                      <Image
                        src={p.image_main}
                        alt={p.name}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 25vw"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}
                  <div className="product-body">
                    <h3>{p.name}</h3>
                    <p className="muted small">
                      {p.description ?? "3D printed product"}
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
