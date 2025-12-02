import Link from "next/link";
import Image from "next/image";
import { supabaseServer } from "@/lib/supabaseServer";
import AddToCartButton from "@/components/AddToCartButton";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = supabaseServer();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, price, image_main")
    .eq("active", true)
    .limit(4);

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
        {/* ... unchanged hero ... */}
      </section>

      {/* Featured products */}
      <section style={{ marginTop: 48 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: "1.2rem" }}>Featured products</h2>
          <Link href="/products" style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
            View all →
          </Link>
        </div>

        <div className="grid grid-4">
          {products?.map((p) => (
            <div key={p.id} className="card" style={{ overflow: "hidden" }}>
              <Link href={`/products/${p.id}`}>
                <div style={{ position: "relative", height: 230 }}>
                  {p.image_main && (
                    <Image
                      src={p.image_main}
                      alt={p.name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  )}
                </div>
              </Link>

              <div style={{ padding: 14 }}>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  {p.name}
                </div>

                <p style={{ color: "#9ca3af", fontSize: "0.8rem", minHeight: 32 }}>
                  {p.description}
                </p>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  {p.price.toFixed(2)} AED
                </div>

                <div style={{ marginTop: 12 }}>
                  <AddToCartButton
                    id={p.id}
                    name={p.name}
                    price={p.price}
                    image={p.image_main}
                    small
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
