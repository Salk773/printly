"use client";
import React, { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  price_aed: number;
  category?: string;
  image_url?: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/products");
        const json = await res.json();
        setProducts(json.products ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <main style={{padding:24,fontFamily:"system-ui"}}>Loading…</main>;

  return (
    <main style={{maxWidth:960, margin:"40px auto", padding:"0 16px", fontFamily:"system-ui"}}>
      <h1 style={{fontSize:32, marginBottom:16}}>Products</h1>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px,1fr))", gap:16}}>
        {products.map((p) => (
          <div key={p.id} style={{border:"1px solid #eee", borderRadius:12, padding:12}}>
            <div style={{aspectRatio:"4/3", background:"#fafafa", borderRadius:8, marginBottom:8, overflow:"hidden"}}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} style={{width:"100%", height:"100%", objectFit:"cover"}} />
              ) : null}
            </div>
            <div style={{fontWeight:600}}>{p.name}</div>
            <div style={{opacity:.7, fontSize:14, margin:"4px 0 8px"}}>{p.category || "—"}</div>
            <div style={{fontSize:18}}>AED {Number(p.price_aed).toFixed(2)}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
