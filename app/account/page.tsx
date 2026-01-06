"use client";

import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#0a0f1f",
          color: "#e5e7eb",
          padding: "40px 20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p>Loading...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0f1f",
        color: "#e5e7eb",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: 10, fontWeight: 700 }}>
          My Account
        </h1>
        <p style={{ color: "#9ca3af", marginBottom: 30 }}>
          Manage your account settings and view your orders.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {/* Profile Card */}
          <Link
            href="/account/profile"
            style={{
              background: "#0f172a",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: 16,
              padding: 24,
              textDecoration: "none",
              color: "inherit",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>👤</div>
            <h2 style={{ fontSize: "1.2rem", marginBottom: 8 }}>Profile</h2>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
              Update your personal information and email address.
            </p>
          </Link>

          {/* Orders Card */}
          <Link
            href="/account/orders"
            style={{
              background: "#0f172a",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: 16,
              padding: 24,
              textDecoration: "none",
              color: "inherit",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>📦</div>
            <h2 style={{ fontSize: "1.2rem", marginBottom: 8 }}>Orders</h2>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
              View your order history and track shipments.
            </p>
          </Link>

          {/* Addresses Card */}
          <Link
            href="/account/addresses"
            style={{
              background: "#0f172a",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: 16,
              padding: 24,
              textDecoration: "none",
              color: "inherit",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>📍</div>
            <h2 style={{ fontSize: "1.2rem", marginBottom: 8 }}>Addresses</h2>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
              Manage your saved shipping addresses.
            </p>
          </Link>

          {/* Recently Viewed Card */}
          <Link
            href="/account/recently-viewed"
            style={{
              background: "#0f172a",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: 16,
              padding: 24,
              textDecoration: "none",
              color: "inherit",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>👁️</div>
            <h2 style={{ fontSize: "1.2rem", marginBottom: 8 }}>
              Recently Viewed
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
              Browse products you've recently viewed.
            </p>
          </Link>

          {/* Email Preferences Card */}
          <Link
            href="/account/email-preferences"
            style={{
              background: "#0f172a",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: 16,
              padding: 24,
              textDecoration: "none",
              color: "inherit",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>✉️</div>
            <h2 style={{ fontSize: "1.2rem", marginBottom: 8 }}>
              Email Preferences
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
              Manage your email notification preferences.
            </p>
          </Link>
        </div>

        {/* User Info */}
        <div
          style={{
            marginTop: 40,
            padding: 20,
            background: "#0f172a",
            border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: 16,
          }}
        >
          <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>
            Account Information
          </h2>
          <div style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
            <p>
              <strong style={{ color: "#e5e7eb" }}>Email:</strong> {user.email}
            </p>
            <p style={{ marginTop: 8 }}>
              <strong style={{ color: "#e5e7eb" }}>User ID:</strong>{" "}
              {user.id.slice(0, 8)}...
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

