import Link from "next/link";
import Image from "next/image";
import { supabaseServer } from "../../lib/supabaseServer"; // ✅ Fixed path

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const supabase = supabaseServer();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  const query = supabase
    .from("products")
    .select("id, name, description, base_price, image_main, active, category_id")
    .eq("active", true)
    .order("name");

  if (searchParams?.category) query.eq("category_id", searchParams.category);
  const { data: products, error } = await query;

  if (error) {
    return (
      <div className="container" style={{ padding: "48px 0" }}>
        Failed to load products.
      </div>
    );
  }

  return (
    <main style={{ padding: "32px 0" }}>
      <div className="container">
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            textAlign: "center",
            marginBottom: "1rem",
          }}
        >
          Products
        </h1>

        {/* Category Filters */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "center",
            marginTop: 16,
          }}
        >
          <Link
            href="/products"
            className="btn secondary"
            style={{
              background: !searchParams?.category ? "var(--accent)" : "#222",
              color: !searchParams?.category ? "#000" : "#fff",
            }}
          >
            All
          </Link>
          {categories?.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.id}`}
              className="btn secondary"
              style={{
                background:
                  searchParams?.category === c.id ? "var(--accent)" : "#222",
                color: searchParams?.category === c.id ? "#000" : "#fff",
              }}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid" style={{ marginTop: 28 }}>
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
                  style={{ objectFit: "cover" }}
                />
              </div>
              <h3 style={{ marginTop: 12, marginBottom: 6 }}>{p.name}</h3>
              <p style={{ color: "var(--muted)", margin: 0 }}>
                {p.description}
              </p>
              <p style={{ marginTop: 8, fontWeight: 700 }}>
                AED {p.base_price?.toFixed(2)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
