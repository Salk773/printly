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
    <div>
      <input
        value={newCategory}
        onChange={(e) => setNewCategory(e.target.value)}
      />
      <button onClick={onAdd}>Add</button>

      {categories.map((c) => (
        <div key={c.id}>
          {editingCategoryId === c.id ? (
            <>
              <input
                value={editingCategoryName}
                onChange={(e) => setEditingCategoryName(e.target.value)}
              />
              <button onClick={() => onSave(c.id)}>Save</button>
            </>
          ) : (
            <>
              <strong>{c.name}</strong>
              <button onClick={() => onEdit(c)}>Rename</button>
              <button onClick={() => onDelete(c.id)}>Delete</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
