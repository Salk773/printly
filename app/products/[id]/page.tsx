// app/products/[id]/page.tsx
import { supabaseServer } from "@/lib/supabaseServer";
import Image from "next/image";
import { notFound } from "next/navigation";

export const revalidate = 0; // disable caching

export default async function ProductPage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !product) {
    console.error(error);
    return notFound();
  }

  return (
    <main
      style={{
        background: "#0a0a0a",
        color: "#fff",
        minHeight: "100vh",
        padding: "40px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2.4rem", marginBottom: "20px" }}>
          {product.name}
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
          }}
        >
          <div>
            {product.image_main ? (
              <Image
                src={product.image_main}
                alt={product.name}
                width={1200}
                height={900}
                unoptimized
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "12px",
                  objectFit: "contain",
                  background: "#000",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "400px",
                  background: "#111",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#555",
                }}
              >
                No image
              </div>
            )}
          </div>

          {/* DETAILS */}
          <div>
            <p style={{ color: "#ccc", fontSize: "1.1rem" }}>
              {product.description}
            </p>

            <p
              style={{
                marginTop: "20px",
                fontSize: "2rem",
                color: "#c084fc",
                fontWeight: 700,
              }}
            >
              {product.price} AED
            </p>

            <div
              style={{
                marginTop: "40px",
                padding: "20px",
                background: "#111",
                borderRadius: "12px",
                border: "1px solid #222",
              }}
            >
              <h3>Printing options (soon)</h3>
              <p style={{ marginTop: "12px", color: "#999" }}>
                Material, colour and quantity options will appear here later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
