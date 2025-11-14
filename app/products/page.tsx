// app/products/page.tsx
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

export const metadata = {
  title: "Products | Printly",
  description: "Browse ready-made 3D printed products from Printly.",
};

export default async function ProductsPage() {
  const supabase = supabaseServer();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, description, price, image_main")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error loading products:", error);
  }

  const safeProducts: Product[] = products ?? [];

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px 60px",
        maxWidth: "1200px",
        margin: "0 auto",
        color: "#fff",
      }}
    >
      <header style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "2.2rem", marginBottom: "8px" }}>All Products</h1>
        <p style={{ color: "#aaa" }}>
          Choose a design, then pick your material and colour on the product page.
        </p>
      </header>

      {safeProducts.length === 0 ? (
        <p style={{ color: "#aaa" }}>No products yet. Add some from the admin panel.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "24px",
          }}
        >
          {safeProducts.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <article
                style={{
                  background: "#111",
                  borderRadius: "14px",
                  border: "1px solid #222",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                {p.image_main && (
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "4/3",
                      marginBottom: "12px",
                      overflow: "hidden",
                      borderRadius: "10px",
                      background: "#000",
                    }}
                  >
                    <Image
                      src={p.image_main}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      style={{
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}

                <h2 style={{ fontSize: "1.1rem", marginBottom: "6px" }}>{p.name}</h2>
                <p
                  style={{
                    color: "#aaa",
                    fontSize: "0.9rem",
                    marginBottom: "10px",
                  }}
                >
                  {p.description || "No description yet."}
                </p>
                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#c084fc" }}>
                    {p.price != null ? `${p.price.toFixed(2)} AED` : "TBD"}
                  </span>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "#999",
                    }}
                  >
                    View details →
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
