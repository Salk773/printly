import AdminHomepageImageUpload from "@/components/AdminHomepageImageUpload";

export default function AdminHomepage({
  images,
  onDelete,
  onUploaded,
}: {
  images: string[];
  onDelete: (url: string) => void;
  onUploaded: () => void;
}) {
  return (
    <div className="card-soft" style={{ padding: 20 }}>
      <h2>Homepage Gallery</h2>
      <AdminHomepageImageUpload onUploaded={onUploaded} />

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        {images.map((url) => (
          <div key={url} style={{ position: "relative" }}>
            <img src={url} style={{ width: 120, borderRadius: 8 }} />
            <button onClick={() => onDelete(url)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
