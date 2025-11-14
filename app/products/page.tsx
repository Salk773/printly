// app/products/page.tsx
import Link from "next/link";
import Image from "next/image";
import { supabaseServer } from "@/lib/supabaseServer";

type Category = { id: string; name: string; slug: string };
type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_main: string | null;
  category_id: string | null;
};

interface ProductsPageProps {
  searchParams?: { q?: string; category?: string };
}

export const metadata = {
  title: "Products | Printly",
  description: "Browse all ready-made 3D printed products.",
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const supabase = supabaseServer();

  const search = searchParams?.q?.trim() || "";
  const selectedCategory = searchParams?.category || "";

  // Load categories
  const { data: categoriesData, error: catError } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (catError) {
    console.error("Error loading categories:", catError.message);
  }

  const categories: Category[] = categoriesData ?? [];

  // Build products query
  let query = supabase
    .from("products")
    .select("id, name, description, price, image_main, category_id")
    .eq("active", true)
    .order("name", { ascending: true });

  if (selectedCategory) {
    query = query.eq("category_id", selectedCategory);
  }

  if (search) {
    // Simple name filter
    query = query.ilike("name", `%${search}%`);
  }

  const { data: productsData, error: prodError } = await query;

  if (prodError) {
    console.error("Error loading products:", prodError.message);
  }

  const products: Product[] = productsData ?? [];

  return (
    <main className="section">
      <div className="container">
        <header className="section-header column">
          <div>
            <h1>Products</h1>
            <p className="muted">
              Filter by category or search by name. All items are 3D printed in the
              UAE.
            </p>
          </div>
          {/* Search + category filters */}
          <form className="filters" method="get">
            <input
              type="text"
              name="q"
              placeholder="Search by name"
              defaultValue={search}
            />
            <select name="category" defaultValue={selectedCategory}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary">
              Apply
            </button>
          </form>
        </header>

        {products.length === 0 ? (
          <p className="muted" style={{ marginTop: "20px" }}>
            No products found. Try clearing filters or add products from the admin panel.
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
    </main>
  );
}
