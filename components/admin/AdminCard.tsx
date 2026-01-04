export default function AdminCard({
  children,
  maxWidth = 760,
  style,
}: {
  children: React.ReactNode;
  maxWidth?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="card-soft"
      style={{ padding: 20, maxWidth, marginBottom: 12, ...style }}
    >
      {children}
    </div>
  );
}
