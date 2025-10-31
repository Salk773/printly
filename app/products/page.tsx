import { supabaseServer } from "../../lib/supabaseServer";
import Link from "next/link"

export default async function ProductsPage() {
  const { data: products } = await supabase
    .from("products")
    .select("id, name, base_price, image_main, category_id")
    .eq("active", true)
    .order("created_at", { ascending: false })

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">All Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products?.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`}>
            <div className="bg-zinc-900 rounded-xl overflow-hidden shadow hover:scale-105 transition">
              <img
                src={p.image_main || "/placeholder.png"}
                alt={p.name}
                className="w-full h-52 object-cover"
              />
              <div className="p-4">
                <h2 className="text-lg font-semibold">{p.name}</h2>
                <p className="text-purple-400 font-bold mt-1">
                  AED {p.base_price?.toFixed(2)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
