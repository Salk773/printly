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

  // ---------------------------
  // GALLERY HELPERS
  // ---------------------------
  const addGalleryImage = (url: string) => {
    setForm((prev) => {
      if (prev.images.length >= MAX_GALLERY) {
        alert(`Maximum ${MAX_GALLERY} images allowed`);
        return prev;
      }
      if (prev.images.includes(url)) return prev;
      return { ...prev, images: [...prev.images, url] };
    });
  };

  const removeGalleryImage = (url: string) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((i) => i !== url),
    }));
  };

  const setAsMain = (url: string) => {
    setForm((prev) => ({ ...prev, image_main: url }));
  };

  // ---------------------------
  // SAVE CHANGES
  // ---------------------------
  const saveChanges = async () => {
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

    if (error) {
      console.error(error);
      alert("Failed to save changes");
      return;
    }

    onSaved();
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 200,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#1f1f25",
          padding: 20,
          borderRadius: 12,
          width: 520,
          maxWidth: "100%",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>Edit product</h2>

        <input
          className="input"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          className="input"
          placeholder="Price"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          style={{ marginTop: 8 }}
        />

        <select
          className="select"
          value={form.category_id || ""}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          style={{ marginTop: 8 }}
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
          placeholder="Description"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          style={{ marginTop: 8 }}
        />

        {/* ACTIVE */}
        <div style={{ marginTop: 10 }}>
          <button
            className="btn-ghost"
            onClick={() => setForm({ ...form, active: !form.active })}
          >
            {form.active ? "Active" : "Inactive"}
          </button>
        </div>

        {/* MAIN IMAGE */}
        <div style={{ marginTop: 14 }}>
          <strong>Main image</strong>
          <AdminImageUpload
            onUploaded={(url) => setForm({ ...form, image_main: url })}
          />

          {form.image_main && (
            <img
              src={form.image_main}
              style={{
                width: 140,
                marginTop: 8,
                borderRadius: 8,
              }}
            />
          )}
        </div>

        {/* GALLERY */}
        <div style={{ marginTop: 16 }}>
          <strong>
            Gallery images ({form.images.length}/{MAX_GALLERY})
          </strong>

          <AdminImageUpload onUploaded={addGalleryImage} />

          {form.images.length > 0 && (
            <div
              style={{
                marginTop: 10,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 10,
              }}
            >
              {form.images.map((url) => (
                <div key={url}>
                  <img
                    src={url}
                    style={{
                      width: "100%",
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <button
                      className="btn-ghost"
                      onClick={() => setAsMain(url)}
                    >
                      Set main
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => removeGalleryImage(url)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={saveChanges}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
