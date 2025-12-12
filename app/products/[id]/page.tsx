import Image from "next/image";
import { supabaseServer } from "@/lib/supabaseServer";
import AddToCartButton from "@/components/AddToCartButton";

export default async function ProductPage({ params }) {
  const supabase = supabaseServer();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!product) {
    return (
      <div
        style={{
          padding: "80px 20px",
          textAlign: "center",
          color: "#94a3b8",
        }}
      >
        Product not found.
      </div>
    );
  }

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 20px",
        color: "white",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: 40,
          alignItems: "start",
        }}
      >
        {/* LEFT: IMAGE GALLERY */}
        <div>
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 520,
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(148,163,184,0.15)",
              background: "#0f172a",
            }}
          >
            <Image
              src={product.image_main}
              alt={product.name}
              fill
              style={{
                objectFit: "cover",
                transition: "0.35s ease",
              }}
            />
          </div>

          {/* Gallery thumbnails (optional future) */}
        </div>

        {/* RIGHT: PRODUCT INFO */}
        <div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              marginBottom: 14,
            }}
          >
            {product.name}
          </h1>

          <p
            style={{
              color: "#94a3b8",
              fontSize: "1rem",
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            {product.description}
          </p>

          {/* PRICE */}
          <div
            style={{
              fontSize: "1.8rem",
              fontWeight: 700,
              background:
                "linear-gradient(135deg, #c084fc 0%, #a855f7 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              marginBottom: 28,
            }}
          >
            {product.price} AED
          </div>

          {/* ADD TO CART */}
          <AddToCartButton
            id={product.id}
            name={product.name}
            price={product.price}
            image={product.image_main}
          />

          {/* ADDITIONAL DETAILS */}
          <div
            style={{
              marginTop: 40,
              paddingTop: 30,
              borderTop: "1px solid rgba(148,163,184,0.15)",
              color: "#94a3b8",
              lineHeight: 1.7,
            }}
          >
            <h3 style={{ fontSize: "1.1rem", marginBottom: 12 }}>
              Additional Details
            </h3>

            <p>
              • Printed with high-quality PLA+ or PETG  
              <br />• Locally printed in the UAE  
              <br />• Durability and dimensional accuracy guaranteed  
              <br />• Custom color options coming soon  
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
