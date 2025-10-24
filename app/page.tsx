import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function HomePage() {
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .limit(4);

  return (
    <main
      style={{
        backgroundColor: "#0a0a0a",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 🧭 Navbar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
          borderBottom: "1px solid #222",
          background: "#0d0d0d",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <h2 style={{ color: "#c084fc", fontWeight: 700, fontSize: "1.4rem" }}>
          Printly
        </h2>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link href="/" style={{ color: "#fff", textDecoration: "none" }}>
            Home
          </Link>
          <Link href="/products" style={{ color: "#fff", textDecoration: "none" }}>
            Products
          </Link>
          <Link href="mailto:contact@printly.ae" style={{ color: "#fff", textDecoration: "none" }}>
            Contact
          </Link>
        </div>
      </nav>

      {/* 🎯 Hero Section */}
      <section
        style={{
          textAlign: "center",
          padding: "100px 20px",
          background: "linear-gradient(145deg, #111, #1b1b1b)",
        }}
      >
        <h1 style={{ fontSize: "3rem", fontWeight: 700 }}>
          Made <span style={{ color: "#c084fc" }}>Layer by Layer</span>.
        </h1>
        <p style={{ color: "#ccc", marginTop: "10px", fontSize: "1.2rem" }}>
          UAE’s first 3D printing marketplace — from creators, for creators.
        </p>
        <Link
          href="/products"
          style={{
            display: "inline-block",
            marginTop: "30px",
            padding: "12px 28px",
            backgroundColor: "#c084fc",
            color: "#000",
            fontWeight: 600,
            borderRadius: "8px",
            textDecoration: "none",
            transition: "0.2s",
          }}
        >
          Browse Products
        </Link>
      </section>

      {/* 🛍️ Featured Products */}
      <section style={{ padding: "60px 40px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "40px" }}>
          Featured Filaments
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
          }}
        >
          {products?.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid #222",
                borderRadius: "12px",
                padding: "20px",
                background: "linear-gradient(145deg, #111, #1a1a1a)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              <h3
                style={{
                  color:
                    p.material === "PLA+"
                      ? "#c084fc"
                      : p.material === "PETG"
                      ? "#00bcd4"
                      : "#fff",
                  marginBottom: "10px",
                }}
              >
                {p.name}
              </h3>
              <p style={{ color: "#ccc", fontSize: "0.9rem" }}>
                {p.description}
              </p>
              <p style={{ fontWeight: 600, marginTop: "8px" }}>
                {p.price} AED
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 🦶 Footer */}
      <footer
        style={{
          marginTop: "auto",
          textAlign: "center",
          padding: "30px",
          borderTop: "1px solid #222",
          color: "#777",
        }}
      >
        © {new Date().getFullYear()} Printly. Made in the UAE 🇦🇪
      </footer>
    </main>
  );
}
import Image from "next/image";
