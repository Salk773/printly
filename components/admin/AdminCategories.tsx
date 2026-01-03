import AdminCard from "@/components/admin/AdminCard";
import { Category } from "@/app/admin/page";

export default function AdminCategories({
  categories,
  newCategory,
  setNewCategory,
  editingCategoryId,
  editingCategoryName,
  setEditingCategoryName,
  onAdd,
  onEdit,
  onSave,
  onDelete,
}: {
  categories: Category[];
  newCategory: string;
  setNewCategory: (v: string) => void;
  editingCategoryId: string | null;
  editingCategoryName: string;
  setEditingCategoryName: (v: string) => void;
  onAdd: () => void;
  onEdit: (c: Category) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      {/* ADD CATEGORY */}
      <AdminCard maxWidth={520}>
        <h2 style={{ marginBottom: 12 }}>Add category</h2>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="input"
            placeholder="New category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button className="btn-primary" onClick={onAdd}>
            Add
          </button>
        </div>
      </AdminCard>

      {/* CATEGORY LIST */}
      {categories.map((c) => (
        <AdminCard key={c.id} maxWidth={520}>
          {editingCategoryId === c.id ? (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                value={editingCategoryName}
                onChange={(e) => setEditingCategoryName(e.target.value)}
              />
              <button
                className="btn-primary"
                onClick={() => onSave(c.id)}
              >
                Save
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <strong style={{ flex: 1 }}>{c.name}</strong>

              <button
                className="btn-ghost"
                onClick={() => onEdit(c)}
              >
                Rename
              </button>

              <button
                className="btn-danger"
                onClick={() => onDelete(c.id)}
              >
                Delete
              </button>
            </div>
          )}
        </AdminCard>
      ))}
    </>
  );
}
