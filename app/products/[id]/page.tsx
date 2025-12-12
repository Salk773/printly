import Image from "next/image";
import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabaseServer";
import AddToCartButton from "@/components/AddToCartButton";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_main: string;
};

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = supabaseServer();
  const { data: product } = await supabase
    .from("products")
    .select("name, description, image_main")
    .eq("id", params.id)
    .single();

  if (!product) {
    return {
      title: "Product not found | Printly",
    };
  }

  return {
    title: `${product.name} | Printly`,
    description:
      product.description ??
      `3D printed ${product.name} — locally made in the UAE.`,
    openGraph: {
      title: `${product.name} | Printly`,
      description:
        product.description ??
        `3D printed ${product.name} — locally made in the UAE.`,
      images: product.image_main ? [{ url: product.image_main }] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
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

  const typedProduct = product as Product;

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
        {/* IMAGE */}
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
              src={typedProduct.image_main}
              alt={typedProduct.name}
              fill
              style={{
                objectFit: "cover",
                transition: "0.35s ease",
              }}
            />
          </div>
        </div>

        {/* INFO */}
        <div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              marginBottom: 14,
            }}
          >
            {typedProduct.name}
          </h1>

          <p
            style={{
              color: "#94a3b8",
              fontSize: "1rem",
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            {typedProduct.description}
          </p>

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
            {typedProduct.price} AED
          </div>

          <AddToCartButton
            id={typedProduct.id}
            name={typedProduct.name}
            price={typedProduct.price}
            image={typedProduct.image_main}
          />

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
              <br />• Durability and dimensional accuracy ensured
              <br />• Custom colour options coming soon
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
