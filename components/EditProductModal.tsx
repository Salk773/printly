"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    name: product.name,
    price: product.price,
    description: product.description,
    category_id: product.category_id,
    image_main: product.image_main,
    active: product.active,
  });

  const [uploading, setUploading] = useState(false);

  // ---------------------------
  // IMAGE UPLOAD
  // ---------------------------
  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const ext = file.name.split(".").pop();
    const filename = `${Date.now()}.${ext}`;
    const path = `products/${filename}`;

    const { error } = await supabase.storage
      .from("uploads")
      .upload(path, file);

    if (error) {
      alert("Upload failed");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("uploads").getPublicUrl(path);

    setForm({ ...form, image_main: data.publicUrl });
    setUploading(false);
  };

  // ---------------------------
  // SAVE CHANGES
  // ---------------------------
  const saveChanges = async () => {
    const { error } = await supabase
      .from("products")
      .update({
        name: form.name,
        price: Number(form.price),
        description: form.description,
        category_id: form.category_id,
        image_main: form.image_main,
        active: form.active,
      })
      .eq("id", product.id);

    if (error) {
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
      }}
    >
      <div
        style={{
          background: "#1f1f25",
          padding: 20,
          borderRadius: 12,
          width: 420,
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
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={{ marginTop: 8 }}
        />

        {/* ACTIVE TOGGLE */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <label style={{ fontSize: "0.9rem" }}>Active:</label>
          <button
            className="btn-ghost"
            style={{
              color: form.active ? "#22c55e" : "#ef4444",
              border: "1px solid #475569",
              padding: "6px 10px",
              borderRadius: 8,
            }}
            onClick={() => setForm({ ...form, active: !form.active })}
          >
            {form.active ? "Active" : "Inactive"}
          </button>
        </div>

        {/* IMAGE UPLOAD */}
        <div style={{ marginTop: 12 }}>
          <label>Replace image:</label>
          <input type="file" onChange={uploadImage} />

          {uploading && <p>Uploading…</p>}

          {form.image_main && (
            <img
              src={form.image_main}
              style={{
                width: 120,
                marginTop: 8,
                borderRadius: 8,
                border: "1px solid #333",
              }}
            />
          )}
        </div>

        {/* BUTTONS */}
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

          <button className="btn-primary" onClick={saveChanges}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
