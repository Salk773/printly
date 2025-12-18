"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminImageUpload from "@/components/AdminImageUpload";

const MAX_GALLERY = 8;

export default function EditProductModal({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: any;
  categories: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: product.name ?? "",
    price: product.price ?? 0,
    description: product.description ?? "",
    category_id: product.category_id ?? "",
    image_main: product.image_main ?? "",
    images: Array.isArray(product.images) ? product.images : [],
    active: !!product.active,
  });

  const addGalleryImage = (url: string) => {
    setForm((p) =>
      p.images.length >= MAX_GALLERY || p.images.includes(url)
        ? p
        : { ...p, images: [...p.images, url] }
    );
  };

  const setAsMain = (url: string) => {
    setForm((p) => ({
      ...p,
      image_main: url,
      images: p.images.includes(url)
        ? p.images
        : [url, ...p.images].slice(0, MAX_GALLERY),
    }));
  };

  const removeGalleryImage = (url: string) => {
    if (url === form.image_main) return;
    setForm((p) => ({
      ...p,
      images: p.images.filter((i) => i !== url),
    }));
  };

  const save = async () => {
    await supabase
      .from("products")
      .update({
        ...form,
        price: Number(form.price),
        category_id: form.category_id || null,
      })
      .eq("id", product.id);

    onSaved();
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)" }}>
      <div style={{ background: "#1f1f25", padding: 20, margin: "10% auto", width: 560 }}>
        <h2>Edit product</h2>

        <AdminImageUpload onUploaded={setAsMain} />
        {form.image_main && <img src={form.image_main} style={{ width: 160 }} />}

        <AdminImageUpload onUploaded={addGalleryImage} />

        {form.images.map((url) => (
          <div key={url}>
            <img src={url} style={{ width: 80 }} />
            <button onClick={() => setAsMain(url)}>Set main</button>
            <button onClick={() => removeGalleryImage(url)}>Remove</button>
          </div>
        ))}

        <button onClick={save}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
