// app/products/page.tsx
import Link from "next/link";
import Image from "next/image";
import { supabaseServer } from "@/lib/supabaseServer";

export const revalidate = 0; // disable caching completely

export default async function ProductsPage() {
  const supabase = supabaseServer();

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px",
        background: "#0a0a0a",
        color: "#fff",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "2.2rem", marginBottom: "30px" }}>All Products</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "24px",
        }}
      >
        {products?.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                background: "#111",
                border: "1px solid #222",
                borderRadius: "12px",
                padding: "16px",
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

              <h2 style={{ fontSize: "1.1rem" }}>{p.name}</h2>
              <p style={{ color: "#aaa", fontSize: "0.9rem" }}>
                {p.description?.slice(0, 60)}...
              </p>

              <p style={{ color: "#c084fc", fontWeight: 600, marginTop: "10px" }}>
                {p.price} AED
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
