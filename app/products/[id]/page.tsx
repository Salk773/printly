import { supabase } from "@/lib/supabaseServer"

export default async function ProductPage({ params }: { params: { id: string } }) {
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single()

  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", params.id)

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <img
        src={product?.image_main || "/placeholder.png"}
        alt={product?.name}
        className="w-full h-80 object-cover rounded-xl"
      />
      <h1 className="text-3xl font-bold mt-6">{product?.name}</h1>
      <p className="text-gray-400 mt-2">{product?.description}</p>

      <h2 className="text-2xl font-semibold mt-6">Available Options</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3">
        {variants?.map((v) => (
          <div
            key={v.id}
            className="border border-zinc-700 rounded-xl p-3 text-center hover:border-purple-400 transition"
          >
            <p className="font-semibold">{v.color}</p>
            <p className="text-sm text-gray-400">{v.material}</p>
            <p className="text-purple-400 font-bold mt-2">AED {v.price}</p>
            <p className="text-xs text-gray-500">Stock: {v.stock}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
