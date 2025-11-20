import { supabaseServer } from "@/lib/supabaseServer";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_main: string | null;
  category_id: string;
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = supabaseServer();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !product) {
    return (
      <div style={{ padding: "40px", color: "#fff" }}>
        <h1>Product not found</h1>
        <p>{error?.message}</p>
      </div>
    );
  }

  return (
    <main
      style={{
        background: "#0a0a0a",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        minHeight: "100vh",
        padding: "40px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* PRODUCT TITLE */}
        <h1 style={{ fontSize: "2.5rem", marginBottom: "30px" }}>
          {product.name}
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
          }}
        >
          {/* PRODUCT IMAGE */}
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
                  padding: "10px",
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
                  fontSize: "1.2rem",
                }}
              >
                No image available
              </div>
            )}
          </div>

          {/* PRODUCT DETAILS */}
          <div>
            <p style={{ fontSize: "1.2rem", color: "#ccc" }}>
              {product.description}
            </p>

            <p
              style={{
                marginTop: "20px",
                fontSize: "2rem",
                fontWeight: 600,
                color: "#c084fc",
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
              <h3>Printing options (coming soon)</h3>
              <p style={{ marginTop: "10px", color: "#bbb" }}>
                Later you’ll be able to pick material (PLA+ / PETG), colours and
                quantity here. For now this is a read-only product preview.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
