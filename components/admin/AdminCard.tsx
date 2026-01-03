export default function AdminCard({
  children,
  maxWidth = 760,
}: {
  children: React.ReactNode;
  maxWidth?: number;
}) {
  return (
    <div
      className="card-soft"
      style={{ padding: 20, maxWidth, marginBottom: 12 }}
    >
      {children}
    </div>
  );
}
