import AdminImageUpload from "@/components/AdminImageUpload";
import AdminCard from "@/components/admin/AdminCard";
import { Category, Product } from "@/app/admin/page";

const MAX_GALLERY = 8;

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
      {products.map((p) => (
        <AdminCard key={p.id} maxWidth={760}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
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

            <strong style={{ flex: 1 }}>{p.name}</strong>

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
      ))}
    </>
  );
}
