"use client";

import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || "");
      setPhone(user.user_metadata?.phone || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: phone,
        },
      });

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

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
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <Link
          href="/account"
          style={{
            color: "#9ca3af",
            fontSize: "0.9rem",
            textDecoration: "none",
            marginBottom: 20,
            display: "inline-block",
          }}
        >
          ← Back to Account
        </Link>

        <h1 style={{ fontSize: "2rem", marginBottom: 10, fontWeight: 700 }}>
          Edit Profile
        </h1>
        <p style={{ color: "#9ca3af", marginBottom: 30 }}>
          Update your personal information.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            background: "#0f172a",
            border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                color: "#cbd5f5",
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={user.email || ""}
              disabled
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(148,163,184,0.3)",
                background: "#020617",
                color: "#9ca3af",
                cursor: "not-allowed",
              }}
            />
            <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4 }}>
              Email cannot be changed
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                color: "#cbd5f5",
                marginBottom: 6,
              }}
            >
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(148,163,184,0.3)",
                background: "#020617",
                color: "white",
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                color: "#cbd5f5",
                marginBottom: 6,
              }}
            >
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your phone number"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(148,163,184,0.3)",
                background: "#020617",
                color: "white",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              width: "100%",
              padding: "12px 18px",
              borderRadius: 999,
              border: "none",
              background: saving
                ? "rgba(192,132,252,0.5)"
                : "linear-gradient(135deg, #c084fc, #a855f7)",
              color: "#020617",
              fontWeight: 700,
              cursor: saving ? "wait" : "pointer",
              fontSize: "0.95rem",
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </main>
  );
}

