import AdminImageUpload from "@/components/AdminImageUpload";
import AdminCard from "@/components/admin/AdminCard";
import { Category, Product } from "@/app/admin/page";

export default function AdminProducts({
  products,
  categories,
  newProduct,
  setNewProduct,
  addProduct,
  toggleActive,
  deleteProduct,
  onEdit,
}: {
  products: Product[];
  categories: Category[];
  newProduct: any;
  setNewProduct: any;
  addProduct: () => void;
  toggleActive: (p: Product) => void;
  deleteProduct: (id: string) => void;
  onEdit: (p: Product) => void;
}) {
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
              display: "block",
            }}
          />
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
      {products.map((p) => (
        <AdminCard key={p.id} maxWidth={760}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            {/* THUMBNAIL */}
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

            {/* NAME */}
            <strong style={{ flex: 1 }}>{p.name}</strong>

            {/* ACTIVE TOGGLE */}
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

            {/* ACTIONS */}
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
      ))}
    </>
  );
}
