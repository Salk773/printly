export type AdminTab =
  | "products"
  | "categories"
  | "homepage"
  | "orders"
  | "reviews"
  | "shipping"
  | "inventory"
  | "customers"
  | "coupons"
  | "emails"
  | "analytics"
  | "social"
  | "logs";

export default function AdminTabs({
  setTab,
}: {
  setTab: (t: AdminTab) => void;
}) {
  const btn = (id: AdminTab, label: string) => (
    <button key={id} type="button" onClick={() => setTab(id)}>
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
      {btn("products", "Products")}
      {btn("categories", "Categories")}
      {btn("homepage", "Homepage")}
      {btn("orders", "Orders")}
      {btn("reviews", "Reviews")}
      {btn("inventory", "Stock")}
      {btn("shipping", "Shipping")}
      {btn("customers", "Customers")}
      {btn("coupons", "Discount codes")}
      {btn("emails", "Emails")}
      {btn("analytics", "Analytics")}
      {btn("social", "Social workflow")}
      {btn("logs", "Logs")}
    </div>
  );
}
