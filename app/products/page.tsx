import Image from 'next/image';
import { supabaseServer } from '../../../lib/supabaseServer';

export default async function ProductDetails({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();

  const { data: product } = await supabase
    .from('products')
    .select('id, name, description, base_price, image_main, active')
    .eq('id', params.id)
    .single();

  const { data: variants } = await supabase
    .from('product_variants')
    .select('id, color, material, price, stock')
    .eq('product_id', params.id);

  if (!product) {
    return <div className="container" style={{ padding: '48px 0' }}>Product not found.</div>;
  }

  return (
    <main style={{ padding: '40px 0' }}>
      <div className="container" style={{ display:'grid', gap: 28, gridTemplateColumns:'1fr', alignItems:'start' }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ position:'relative', width:'100%', aspectRatio:'4/3', borderRadius: 12, overflow:'hidden' }}>
            <Image
              src={product.image_main || '/placeholder.png'}
              alt={product.name}
              fill
              sizes="100vw"
              style={{ objectFit:'cover' }}
              priority
            />
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h1 style={{ marginTop: 0 }}>{product.name}</h1>
          <p style={{ color: 'var(--muted)' }}>{product.description}</p>
          <p style={{ fontWeight: 800, fontSize: '1.2rem' }}>AED {product.base_price?.toFixed(2)}</p>

          {variants && variants.length > 0 && (
            <>
              <h3 style={{ marginTop: 20 }}>Available Options</h3>
              <div className="grid" style={{ gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))' }}>
                {variants.map((v) => (
                  <div key={v.id} className="card" style={{ padding: 12 }}>
                    <p style={{ fontWeight: 700 }}>{v.color}</p>
                    <p style={{ color:'var(--muted)', margin: 0 }}>{v.material}</p>
                    <p style={{ marginTop: 6, color:'var(--accent)', fontWeight:700 }}>AED {v.price?.toFixed(2)}</p>
                    <p style={{ fontSize: '.85rem', color:'#999', marginTop: 2 }}>Stock: {v.stock}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          <button className="btn" style={{ marginTop: 20 }} disabled>
            Add to Cart (coming soon)
          </button>
        </div>
      </div>
    </main>
  );
}
