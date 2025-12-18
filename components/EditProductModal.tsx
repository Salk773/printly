"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import AdminImageUpload from "@/components/AdminImageUpload";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  const [saving, setSaving] = useState(false);

  /* ---------------- IMAGE HANDLERS ---------------- */

  const handleMainUpload = (url: string) => {
    setForm((prev) => ({
      ...prev,
      image_main: url,
      images: prev.images.includes(url)
        ? prev.images
        : [url, ...prev.images].slice(0, MAX_GALLERY),
    }));
  };

  const handleGalleryUpload = (url: string) => {
    setForm((prev) => {
      if (prev.images.length >= MAX_GALLERY) return prev;
      if (prev.images.includes(url)) return prev;
      return { ...prev, images: [...prev.images, url] };
    });
  };

  const setAsMain = (url: string) => {
    setForm((prev) => ({ ...prev, image_main: url }));
  };

  const removeGalleryImage = (url: string) => {
    if (url === form.image_main) return;
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((i) => i !== url),
    }));
  };

  const moveImage = (index: number, dir: "up" | "down") => {
    setForm((prev) => {
      const imgs = [...prev.images];
      const target = dir === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= imgs.length) return prev;
      [imgs[index], imgs[target]] = [imgs[target], imgs[index]];
      return { ...prev, images: imgs };
    });
  };

  /* ---------------- SAVE ---------------- */

  const saveChanges = async () => {
    if (form.active && !form.image_main) return;

    setSaving(true);

    const { error } = await supabase
      .from("products")
      .update({
        name: form.name,
        price: Number(form.price),
        description: form.description,
        category_id: form.category_id || null,
        image_main: form.image_main,
        images: form.images,
        active: form.active,
      })
      .eq("id", product.id);

    setSaving(false);
    if (error) return;

    onSaved();
    onClose();
  };

  /* ---------------- UI ---------------- */

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2>Edit product</h2>

        <input
          className="input"
          value={form.name}
          onChange={(e) =>
            setForm((p) => ({ ...p, name: e.target.value }))
          }
        />

        <input
          className="input"
          type="number"
          value={form.price}
          onChange={(e) =>
            setForm((p) => ({ ...p, price: Number(e.target.value) }))
          }
        />

        <select
          className="select"
          value={form.category_id || ""}
          onChange={(e) =>
            setForm((p) => ({ ...p, category_id: e.target.value }))
          }
        >
          <option value="">Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <textarea
          className="textarea"
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
        />

        <button
          className="btn-ghost"
          onClick={() => setForm((p) => ({ ...p, active: !p.active }))}
        >
          {form.active ? "Active" : "Inactive"}
        </button>

        {/* MAIN IMAGE */}
        <strong>Main image</strong>
        <AdminImageUpload onUploaded={handleMainUpload} />
        {form.image_main && <img src={form.image_main} style={mainImage} />}

        {/* GALLERY */}
        <strong>
          Gallery ({form.images.length}/{MAX_GALLERY})
        </strong>
        <AdminImageUpload onUploaded={handleGalleryUpload} />

        <div style={gallery}>
          {form.images.map((url, i) => (
            <div key={url} style={imgCard}>
              {url === form.image_main && <span style={mainBadge}>MAIN</span>}
              <img src={url} style={thumb} />
              <button className="btn-ghost" onClick={() => setAsMain(url)}>
                Set main
              </button>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => moveImage(i, "up")} disabled={i === 0}>
                  ↑
                </button>
                <button
                  onClick={() => moveImage(i, "down")}
                  disabled={i === form.images.length - 1}
                >
                  ↓
                </button>
              </div>
              <button
                className="btn-danger"
                onClick={() => removeGalleryImage(url)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div style={actions}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={saveChanges} disabled={saving}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 200,
};

const modal = {
  background: "#1f1f25",
  padding: 20,
  borderRadius: 12,
  width: 560,
};

const mainImage = { width: 160, marginTop: 8, borderRadius: 8 };
const gallery = { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 };
const imgCard = { border: "1px solid #334155", borderRadius: 8, padding: 6 };
const thumb = { width: "100%", height: 80, objectFit: "cover" };
const mainBadge = {
  position: "absolute",
  top: 4,
  right: 4,
  background: "#c084fc",
  fontSize: "0.7rem",
  padding: "2px 6px",
  borderRadius: 6,
};
const actions = { marginTop: 20, display: "flex", justifyContent: "space-between" };
