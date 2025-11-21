// app/products/page.tsx
import Link from "next/link";
import Image from "next/image";
import { supabaseServer } from "@/lib/supabaseServer";
import CategoryBar from "@/components/CategoryBar";

export const revalidate = 0; // always fresh (no cache)

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_main: string | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string | null;
}

interface ProductsPageProps {
  searchParams?: {
    category?: string;
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const supabase = supabaseServer();

  const activeCategoryId = searchParams?.category ?? "";

  // --- Load categories ---
  const { data: categoriesData, error: catError } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (catError) {
    console.error("Categories error:", catError.message);
  }

  const categories: Category[] = categoriesData ?? [];

  // --- Build product query ---
  let query = supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  if (activeCategoryId) {
    query = query.eq("category_id", activeCategoryId);
  }

  const { data: productsData, error: prodError } = await query;

  if (prodError) {
    console.error("Products error:", prodError.message);
  }

  const products: Product[] = productsData ?? [];

  const activeCategoryName =
    categories.find((c) => c.id === activeCategoryId)?.name || "All products";

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 0 60px",
        background: "#0a0a0a",
        color: "#fff",
      }}
    >
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "0 20px",
        }}
      >
        {/* Header */}
        <header style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "2.2rem", marginBottom: "6px" }}>
            Products
          </h1>
          <p style={{ color: "#c0c0d0", fontSize: "0.95rem", margin: 0 }}>
            {activeCategoryId
              ? `Showing ${activeCategoryName.toLowerCase()}`
              : "Showing all products. Choose a category to filter."}
          </p>

          {/* Category bar */}
          <CategoryBar
            categories={categories}
            activeCategoryId={activeCategoryId}
          />
        </header>

        {/* Products grid */}
        {products.length === 0 ? (
          <p style={{ color: "#c0c0d0", marginTop: "20px" }}>
            No products found for this selection.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "24px",
              marginTop: "20px",
            }}
          >
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    background: "#111118",
                    border: "1px solid #262637",
                    borderRadius: "12px",
                    padding: "14px",
                  }}
                >
                  {p.image_main && (
                    <Image
                      src={p.image_main}
                      alt={p.name}
                      width={400}
                      height={300}
                      unoptimized
                      style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: "10px",
                        marginBottom: "10px",
                        background: "#000",
                        objectFit: "cover",
                      }}
                    />
                  )}

                  <h2 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>
                    {p.name}
                  </h2>
                  <p
                    style={{
                      color: "#c0c0d0",
                      fontSize: "0.9rem",
                      minHeight: "2.4em",
                    }}
                  >
                    {p.description
                      ? p.description.slice(0, 80) + "..."
                      : "3D printed product"}
                  </p>

                  <p
                    style={{
                      color: "#c084fc",
                      fontWeight: 600,
                      marginTop: "10px",
                    }}
                  >
                    {p.price != null ? `${p.price} AED` : "TBD"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
