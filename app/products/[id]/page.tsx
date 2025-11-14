// app/products/[id]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { supabaseServer } from "@/lib/supabaseServer";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_main: string | null;
};

interface ProductPageProps {
  params: { id: string };
}

export const metadata = {
  title: "Product | Printly",
};

export default async function ProductPage({ params }: ProductPageProps) {
  const supabase = supabaseServer();

  const { data: product, error } = await supabase
    .from("products")
    .select("id, name, description, price, image_main")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    console.error("Error loading product:", error);
  }

  if (!product) {
    return notFound();
  }

  const p = product as Product;

  // Simple - your “material & colour choices later” UI can go here.
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px 60px",
        maxWidth: "1000px",
        margin: "0 auto",
        color: "#fff",
      }}
    >
      <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)" }}>
        {/* IMAGE */}
        <section>
          {p.image_main && (
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "4/3",
                borderRadius: "16px",
                overflow: "hidden",
                background: "#000",
                border: "1px solid #222",
              }}
            >
              <Image
                src={p.image_main}
                alt={p.name}
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />
            </div>
          )}
        </section>

        {/* INFO */}
        <section>
          <h1 style={{ fontSize: "2rem", marginBottom: "10px" }}>{p.name}</h1>
          <p style={{ color: "#aaa", marginBottom: "16px" }}>
            {p.description || "No description yet."}
          </p>
          <p
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "#c084fc",
              marginBottom: "24px",
            }}
          >
            {p.price != null ? `${p.price.toFixed(2)} AED` : "Price on request"}
          </p>

          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #222",
              background: "#0f0f0f",
              marginBottom: "18px",
            }}
          >
            <h2 style={{ fontSize: "1rem", marginBottom: "8px" }}>
              Printing options (coming soon)
            </h2>
            <p style={{ fontSize: "0.9rem", color: "#aaa" }}>
              Here you’ll be able to choose material (PLA+ / PETG), colours, and
              quantity. For now this is a read-only prototype page.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
