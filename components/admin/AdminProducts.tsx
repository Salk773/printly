import AdminImageUpload from "@/components/AdminImageUpload";
import AdminCard from "@/components/admin/AdminCard";
import { Category, Product } from "@/app/admin/page";
import { useState } from "react";

const MAX_GALLERY = 8;

export default function AdminProducts({
  products,
  categories,
  newProduct,
  setNewProduct,
  addProduct,
  toggleActive,
  updateStockQuantity,
  deleteProduct,
  onEdit,
}: {
  products: Product[];
  categories: Category[];
  newProduct: any;
  setNewProduct: any;
  addProduct: () => void;
  toggleActive: (p: Product) => void;
  updateStockQuantity: (productId: string, quantity: number | null) => void;
  deleteProduct: (id: string) => void;
  onEdit: (p: Product) => void;
}) {
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockInput, setStockInput] = useState<string>("");
  const addGalleryImage = (url: string) => {
    setNewProduct((p: any) => {
      if (p.images.length >= MAX_GALLERY) return p;
      if (p.images.includes(url)) return p;
      return { ...p, images: [...p.images, url] };
    });
  };

  return (
    <>
      {/* ADD PRODUCT */}
      <AdminCard maxWidth={760}>
        <h2 style={{ marginBottom: 12 }}>Add product</h2>

        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            className="input"
            placeholder="Name"
            value={newProduct.name}
            onChange={(e) =>
              setNewProduct((p: any) => ({ ...p, name: e.target.value }))
            }
          />

          <input
            className="input"
            type="number"
            placeholder="Price"
            value={newProduct.price}
            onChange={(e) =>
              setNewProduct((p: any) => ({ ...p, price: e.target.value }))
            }
          />

          <select
            className="select"
            value={newProduct.category_id}
            onChange={(e) =>
              setNewProduct((p: any) => ({
                ...p,
                category_id: e.target.value,
              }))
            }
          >
            <option value="">Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* FEATURED CHECKBOX */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={newProduct.featured || false}
            onChange={(e) =>
              setNewProduct((p: any) => ({ ...p, featured: e.target.checked }))
            }
          />
          <span>Featured product</span>
        </label>

        {/* STOCK MANAGEMENT */}
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            className="input"
            type="number"
            placeholder="Stock quantity (leave empty for unlimited)"
            value={newProduct.stock_quantity || ""}
            onChange={(e) =>
              setNewProduct((p: any) => ({ ...p, stock_quantity: e.target.value }))
            }
          />
          <input
            className="input"
            type="number"
            placeholder="Low stock threshold"
            value={newProduct.low_stock_threshold || "5"}
            onChange={(e) =>
              setNewProduct((p: any) => ({ ...p, low_stock_threshold: e.target.value }))
            }
          />
        </div>

        {/* MAIN IMAGE */}
        <strong>Main image</strong>
        <AdminImageUpload
          onUploaded={(url) =>
            setNewProduct((p: any) => ({ ...p, image_main: url }))
          }
        />

        {newProduct.image_main && (
          <img
            src={newProduct.image_main}
            style={{
              width: 160,
              marginTop: 8,
              borderRadius: 8,
            }}
          />
        )}

        {/* GALLERY */}
        <strong style={{ marginTop: 12, display: "block" }}>
          Gallery images ({newProduct.images.length}/{MAX_GALLERY})
        </strong>

        <AdminImageUpload onUploaded={addGalleryImage} />

        {newProduct.images.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 8,
              flexWrap: "wrap",
            }}
          >
            {newProduct.images.map((url: string, idx: number) => (
              <img
                key={`${url}-${idx}`}
                src={url}
                style={{
                  width: 60,
                  height: 60,
                  objectFit: "cover",
                  borderRadius: 6,
                }}
              />
            ))}
          </div>
        )}

        <button
          className="btn-primary"
          style={{ marginTop: 12 }}
          onClick={addProduct}
        >
          Save product
        </button>
      </AdminCard>

      {/* PRODUCT LIST */}
      {products.map((p) => {
        const isEditingStock = editingStockId === p.id;
        const stockValue = p.stock_quantity ?? null;
        const stockDisplay = stockValue === null ? "Unlimited" : stockValue.toString();

        return (
          <AdminCard key={p.id} maxWidth={760}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              {p.image_main && (
                <img
                  src={p.image_main}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 6,
                    objectFit: "cover",
                  }}
                />
              )}

              <div style={{ flex: 1, minWidth: 200 }}>
                <strong style={{ display: "block", marginBottom: 4 }}>{p.name}</strong>
                <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                  {p.price.toFixed(2)} AED
                </div>
              </div>

              {/* STOCK QUANTITY */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isEditingStock ? (
                  <>
                    <input
                      type="number"
                      value={stockInput}
                      onChange={(e) => setStockInput(e.target.value)}
                      placeholder="Qty"
                      style={{
                        width: 100,
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid rgba(148,163,184,0.3)",
                        background: "#020617",
                        color: "white",
                        fontSize: "0.85rem",
                      }}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const newQty = stockInput.trim() === "" ? null : parseInt(stockInput);
                          if (stockInput.trim() === "" || (!isNaN(newQty!) && newQty! >= 0)) {
                            updateStockQuantity(p.id, newQty);
                            setEditingStockId(null);
                            setStockInput("");
                          }
                        } else if (e.key === "Escape") {
                          setEditingStockId(null);
                          setStockInput("");
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const newQty = stockInput.trim() === "" ? null : parseInt(stockInput);
                        if (stockInput.trim() === "" || (!isNaN(newQty!) && newQty! >= 0)) {
                          updateStockQuantity(p.id, newQty);
                          setEditingStockId(null);
                          setStockInput("");
                        }
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: "#22c55e",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setEditingStockId(null);
                        setStockInput("");
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: "#ef4444",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        background: stockValue === null 
                          ? "rgba(148,163,184,0.1)" 
                          : stockValue === 0
                          ? "rgba(239,68,68,0.2)"
                          : stockValue <= (p.low_stock_threshold || 5)
                          ? "rgba(245,158,11,0.2)"
                          : "rgba(34,197,94,0.2)",
                        color: stockValue === null
                          ? "#94a3b8"
                          : stockValue === 0
                          ? "#ef4444"
                          : stockValue <= (p.low_stock_threshold || 5)
                          ? "#f59e0b"
                          : "#22c55e",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        minWidth: 100,
                        textAlign: "center",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setEditingStockId(p.id);
                        setStockInput(stockValue === null ? "" : stockValue.toString());
                      }}
                      title="Click to edit stock quantity"
                    >
                      Stock: {stockDisplay}
                    </div>
                  </>
                )}
              </div>

              <button
                className="btn-ghost"
                onClick={() => toggleActive(p)}
                style={{
                  color: p.active ? "#22c55e" : "#ef4444",
                  fontWeight: 600,
                }}
              >
                {p.active ? "Active" : "Inactive"}
              </button>

              <button className="btn-ghost" onClick={() => onEdit(p)}>
                Edit
              </button>

              <button
                className="btn-danger"
                onClick={() => deleteProduct(p.id)}
              >
                Delete
              </button>
            </div>
          </AdminCard>
        );
      })}
    </>
  );
}
