import { Suspense } from "react";
import CheckoutSuccessClient from "./success-client";

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <CheckoutSuccessClient />
    </Suspense>
  );
}

function SuccessFallback() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0f1f",
        color: "#e5e7eb",
        padding: "60px 20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <p style={{ color: "#9ca3af" }}>Loading order…</p>
    </main>
  );
}
