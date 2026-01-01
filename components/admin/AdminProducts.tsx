import AdminImageUpload from "@/components/AdminImageUpload";
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
      <div className="card-soft" style={{ padding: 20 }}>
        <h2>Add product</h2>

        <input
          placeholder="Name"
          value={newProduct.name}
          onChange={(e) =>
            setNewProduct((p: any) => ({ ...p, name: e.target.value }))
          }
        />

        <input
          type="number"
          placeholder="Price"
          value={newProduct.price}
          onChange={(e) =>
            setNewProduct((p: any) => ({ ...p, price: e.target.value }))
          }
        />

        <select
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

        <AdminImageUpload
          onUploaded={(url) =>
            setNewProduct((p: any) => ({ ...p, image_main: url }))
          }
        />

        <button onClick={addProduct}>Save product</button>
      </div>

      {products.map((p) => (
        <div key={p.id} className="card-soft" style={{ padding: 14 }}>
          <strong>{p.name}</strong>

          <button onClick={() => toggleActive(p)}>
            {p.active ? "Active" : "Inactive"}
          </button>

          <button onClick={() => onEdit(p)}>Edit</button>
          <button onClick={() => deleteProduct(p.id)}>Delete</button>
        </div>
      ))}
    </>
  );
}
