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

  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, price, image_main")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    console.error("Error loading product:", error.message);
  }

  if (!data) return notFound();

  const p = data as Product;

  return (
    <main className="section">
      <div className="container product-layout">
        <section>
          {p.image_main && (
            <div className="product-detail-image">
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

        <section className="product-detail-info">
          <h1>{p.name}</h1>
          <p className="muted" style={{ marginBottom: "16px" }}>
            {p.description || "3D printed item."}
          </p>
          <p className="price-lg">
            {p.price != null ? `${p.price.toFixed(2)} AED` : "Price on request"}
          </p>

          <div className="card" style={{ marginTop: "16px" }}>
            <h2 className="small">Printing options (coming soon)</h2>
            <p className="muted small">
              Later you’ll be able to pick material (PLA+ / PETG), colours and
              quantity here. For now this is a read-only product preview.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
