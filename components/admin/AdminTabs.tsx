export default function AdminTabs({
  setTab,
}: {
  setTab: (t: "products" | "categories" | "homepage" | "orders" | "logs") => void;
}) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
      <button onClick={() => setTab("products")}>Products</button>
      <button onClick={() => setTab("categories")}>Categories</button>
      <button onClick={() => setTab("homepage")}>Homepage</button>
      <button onClick={() => setTab("orders")}>Orders</button>
      <button onClick={() => setTab("logs")}>Logs</button>
    </div>
  );
}
