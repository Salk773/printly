"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminImageUpload from "@/components/AdminImageUpload";
import { getErrorMessage } from "@/lib/errorMessage";

const MAX_GALLERY = 8;

function isMissingProductColumnError(error: any, column: string) {
  const message = getErrorMessage(error, "").toLowerCase();
  return (
    error?.code === "PGRST204" &&
    message.includes(column.toLowerCase())
  );
}

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
    name: "",
    price: 0,
    description: "",
    weight_text: "",
    dimensions_text: "",
    category_id: "",
    image_main: "",
    images: [] as string[],
    active: false,
    featured: false,
  });

  const [saving, setSaving] = useState(false);

  /* 🔑 CRITICAL FIX — SYNC STATE WHEN PRODUCT CHANGES */
  useEffect(() => {
    setForm({
      name: product.name ?? "",
      price: product.price ?? 0,
      description: product.description ?? "",
      weight_text: product.weight_text ?? "",
      dimensions_text: product.dimensions_text ?? "",
      category_id: product.category_id ?? "",
      image_main: product.image_main ?? "",
      images: Array.isArray(product.images) ? product.images : [],
      active: !!product.active,
      featured: !!product.featured,
    });
  }, [product]);

  /* ---------- IMAGE HELPERS ---------- */

  const addGalleryImage = (url: string) => {
    setForm((prev) => {
      if (prev.images.length >= MAX_GALLERY) return prev;
      if (prev.images.includes(url)) return prev;
      return { ...prev, images: [...prev.images, url] };
    });
  };

  const setAsMain = (url: string) => {
    setForm((prev) => ({
      ...prev,
      image_main: url,
      images: prev.images.includes(url)
        ? prev.images
        : [url, ...prev.images].slice(0, MAX_GALLERY),
    }));
  };

  const removeGalleryImage = (url: string) => {
    if (url === form.image_main) return;
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((i) => i !== url),
    }));
  };

  const moveImage = (i: number, dir: "up" | "down") => {
    setForm((prev) => {
      const imgs = [...prev.images];
      const t = dir === "up" ? i - 1 : i + 1;
      if (t < 0 || t >= imgs.length) return prev;
      [imgs[i], imgs[t]] = [imgs[t], imgs[i]];
      return { ...prev, images: imgs };
    });
  };

  /* ---------- SAVE ---------- */

  const saveChanges = async () => {
    if (form.active && !form.image_main) return;

    setSaving(true);

    const optionalColumns = {
      featured: form.featured,
      weight_text: form.weight_text.trim() || null,
      dimensions_text: form.dimensions_text.trim() || null,
    };

    // Build update payload
    const updatePayload: any = {
      name: form.name,
      price: Number(form.price),
      description: form.description,
      category_id: form.category_id || null,
      image_main: form.image_main,
      images: form.images,
      active: form.active,
      ...optionalColumns,
    };

    let { error } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", product.id);

    const missingOptionalColumns: string[] = [];
    for (const column of Object.keys(optionalColumns)) {
      if (error && isMissingProductColumnError(error, column)) {
        console.warn(`${column} column doesn't exist, updating without it`);
        delete updatePayload[column];
        missingOptionalColumns.push(column);
        const retryResult = await supabase
          .from("products")
          .update(updatePayload)
          .eq("id", product.id);
        error = retryResult.error;
      }
    }

    setSaving(false);

    if (error) {
      console.error("Update error:", error);
      alert("Failed to update product: " + getErrorMessage(error));
      return;
    }

    if (missingOptionalColumns.length > 0) {
      alert(
        `Product updated, but these optional columns are missing in Supabase: ${missingOptionalColumns.join(", ")}. Please run the related product migrations.`
      );
    }

    onSaved();
    onClose();
  };

  /* ---------- UI ---------- */

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2>Edit product</h2>

        <input
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          className="input"
          type="number"
          value={form.price}
          onChange={(e) =>
            setForm({ ...form, price: Number(e.target.value) })
          }
        />

        <select
          className="select"
          value={form.category_id || ""}
          onChange={(e) =>
            setForm({ ...form, category_id: e.target.value })
          }
        >
          <option value="">Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label style={{ display: "block", marginBottom: 6, fontSize: "0.875rem", color: "#94a3b8" }}>
          Short description{" "}
          <span style={{ fontWeight: 400, opacity: 0.85 }}>(shown on product cards)</span>
        </label>
        <textarea
          className="textarea"
          placeholder="Optional — appears under the product name on listing cards"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          rows={3}
        />

        <label style={{ display: "block", marginBottom: 6, fontSize: "0.875rem", color: "#94a3b8" }}>
          Weight <span style={{ fontWeight: 400, opacity: 0.85 }}>(shown on product page)</span>
        </label>
        <input
          className="input"
          placeholder="e.g. 250 g, 2.5 kg"
          value={form.weight_text}
          onChange={(e) =>
            setForm({ ...form, weight_text: e.target.value })
          }
          style={{ marginBottom: 12 }}
        />

        <label style={{ display: "block", marginBottom: 6, fontSize: "0.875rem", color: "#94a3b8" }}>
          Dimensions <span style={{ fontWeight: 400, opacity: 0.85 }}>(shown on product page)</span>
        </label>
        <input
          className="input"
          placeholder="e.g. 30 × 20 × 5 cm"
          value={form.dimensions_text}
          onChange={(e) =>
            setForm({ ...form, dimensions_text: e.target.value })
          }
          style={{ marginBottom: 12 }}
        />

        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <button
            className="btn-ghost"
            onClick={() => setForm({ ...form, active: !form.active })}
          >
            {form.active ? "Active" : "Inactive"}
          </button>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) =>
                setForm({ ...form, featured: e.target.checked })
              }
            />
            <span>Featured product</span>
          </label>
        </div>

        <strong>Main image</strong>
        <AdminImageUpload onUploaded={setAsMain} />

        {form.image_main && (
          <img
            src={form.image_main}
            style={mainImage}
          />
        )}

        <strong>
          Gallery ({form.images.length}/{MAX_GALLERY})
        </strong>
        <AdminImageUpload onUploaded={addGalleryImage} />

        <div style={gallery}>
          {form.images.map((url, i) => (
            <div key={`${url}-${i}`} style={imgCard}>
              {url === form.image_main && (
                <span style={mainBadge}>MAIN</span>
              )}

              <img src={url} style={thumb} />

              <button className="btn-ghost" onClick={() => setAsMain(url)}>
                Set main
              </button>

              <div>
                <button onClick={() => moveImage(i, "up")}>↑</button>
                <button onClick={() => moveImage(i, "down")}>↓</button>
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
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 16,
  zIndex: 200,
};

const modal: React.CSSProperties = {
  background: "#1f1f25",
  padding: 20,
  borderRadius: 12,
  width: 560,
  maxWidth: "100%",
  maxHeight: "calc(100vh - 32px)",
  overflowY: "auto",
};

const mainImage: React.CSSProperties = {
  width: 160,
  marginTop: 8,
  borderRadius: 8,
};

const gallery: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4,1fr)",
  gap: 10,
};

const imgCard: React.CSSProperties = {
  border: "1px solid #334155",
  borderRadius: 8,
  padding: 6,
  position: "relative",
};

const thumb: React.CSSProperties = {
  width: "100%",
  height: 80,
  objectFit: "cover",
};

const mainBadge: React.CSSProperties = {
  position: "absolute",
  top: 4,
  right: 4,
  background: "#c084fc",
  padding: "2px 6px",
  fontSize: "0.7rem",
};

const actions: React.CSSProperties = {
  position: "sticky",
  bottom: -20,
  display: "flex",
  justifyContent: "space-between",
  marginTop: 20,
  padding: "12px 0 0",
  background: "#1f1f25",
};
