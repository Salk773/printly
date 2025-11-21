// app/products/[id]/page.tsx
import { supabaseServer } from "@/lib/supabaseServer";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";

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

  if (!product || error) {
    return (
      <main
        style={{
          color: "#fff",
          padding: "50px",
          fontFamily: "system-ui",
        }}
      >
        <h1>Product not found</h1>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "40px",
        color: "#fff",
        fontFamily: "system-ui",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "40px",
        }}
      >
        {/* IMAGE */}
        <div>
          {product.image_main && (
            <Image
              src={product.image_main}
              alt={product.name}
              width={600}
              height={600}
              style={{
                width: "100%",
                height: "auto",
                borderRadius: "12px",
              }}
            />
          )}
        </div>

        {/* DETAILS */}
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "10px" }}>
            {product.name}
          </h1>

          <p style={{ fontSize: "1.2rem", color: "#aaa" }}>
            {product.description}
          </p>

          <p
            style={{
              marginTop: "20px",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#c084fc",
            }}
          >
            {product.price} AED
          </p>

          {/* ADD TO CART BUTTON — FIXED */}
          <div style={{ marginTop: "20px" }}>
            <AddToCartButton
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.image_main}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
