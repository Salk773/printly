import React from "react";

async function getData() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  const res = await fetch(`${base}/api/products`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to load products");
  return res.json();
}

export default async function ProductsPage() {
  const { products } = await getData();

  return (
    <main style={{maxWidth: 960, margin: "40px auto", padding: "0 16px", fontFamily: "system-ui"}}>
      <h1 style={{fontSize: 32, marginBottom: 16}}>Products</h1>
      <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 16}}>
        {(products || []).map((p: any) => (
          <div key={p.id} style={{border: "1px solid #eee", borderRadius: 12, padding: 12}}>
            <div style={{aspectRatio: "4/3", background:"#fafafa", borderRadius: 8, marginBottom: 8, overflow:"hidden"}}>
              {p.image_url ? <img src={p.image_url} alt={p.name} style={{width:"100%", height:"100%", objectFit:"cover"}}/> : null}
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
