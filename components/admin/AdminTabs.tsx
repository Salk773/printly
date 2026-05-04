export default function AdminTabs({
  setTab,
}: {
  setTab: (
    t: "products" | "categories" | "homepage" | "orders" | "coupons" | "logs" | "analytics"
  ) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
      <button onClick={() => setTab("products")}>Products</button>
      <button onClick={() => setTab("categories")}>Categories</button>
      <button onClick={() => setTab("homepage")}>Homepage</button>
      <button onClick={() => setTab("orders")}>Orders</button>
      <button onClick={() => setTab("coupons")}>Discount codes</button>
      <button onClick={() => setTab("analytics")}>Analytics</button>
      <button onClick={() => setTab("logs")}>Logs</button>
    </div>
  );
}
