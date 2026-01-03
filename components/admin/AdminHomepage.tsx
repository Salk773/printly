import AdminCard from "@/components/admin/AdminCard";
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
    <AdminCard maxWidth={760}>
      <h2 style={{ marginBottom: 12 }}>Homepage Gallery</h2>

      <AdminHomepageImageUpload onUploaded={onUploaded} />

      {images.length === 0 && (
        <p style={{ opacity: 0.6, marginTop: 10 }}>
          No homepage images uploaded yet.
        </p>
      )}

      {images.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 12,
            flexWrap: "wrap",
          }}
        >
          {images.map((url) => (
            <div
              key={url}
              style={{
                position: "relative",
                width: 140,
                height: 90,
              }}
            >
              <img
                src={url}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 8,
                }}
              />

              <button
                className="btn-danger"
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  padding: "2px 6px",
                  fontSize: 12,
                }}
                onClick={() => onDelete(url)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </AdminCard>
  );
}
