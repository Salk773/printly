import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_main: string | null;
};

export const revalidate = 60;

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,description,price,image_main,active")
    .eq("id", params.id)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) {
    return (
      <main>
        <p>Product not found.</p>
      </main>
    );
  }

  const product = data as Product;

  return (
    <main
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
        gap: 28,
      }}
    >
      {/* Image */}
      <div
        style={{
          borderRadius: 20,
          overflow: "hidden",
          background:
            "radial-gradient(circle at top left, #1e293b, #020617)",
          border: "1px solid rgba(148,163,184,0.4)",
          position: "relative",
          minHeight: 320,
        }}
      >
        {product.image_main ? (
          <Image
            src={product.image_main}
            alt={product.name}
            fill
            style={{ objectFit: "contain" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6b7280",
            }}
          >
            No image available
          </div>
        )}
      </div>

      {/* Info */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.8rem",
              marginBottom: 4,
            }}
          >
            {product.name}
          </h1>
          <p style={{ color: "#9ca3af" }}>
            {product.description || "Custom 3D printed product."}
          </p>
        </div>

        <div>
          <div
            style={{
              fontSize: "1.2rem",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {product.price.toFixed(2)} AED
          </div>
          <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
            Final price may vary slightly with material and size options.
          </p>
        </div>

        <div
          style={{
            marginTop: 10,
            padding: "16px 16px 14px",
            borderRadius: 16,
            background: "rgba(15,23,42,0.9)",
            border: "1px solid rgba(148,163,184,0.4)",
          }}
        >
          <h2
            style={{
              fontSize: "0.95rem",
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            Printing options (coming soon)
          </h2>
          <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
            Later you&apos;ll be able to pick material (PLA+ / PETG), colours
            and quantity here. For now this is a read-only product preview.
          </p>
        </div>

        <AddToCartButton
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            image_main: product.image_main,
          }}
        />
      </section>
    </main>
  );
}
