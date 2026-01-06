"use client";

import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function EmailPreferencesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [preferences, setPreferences] = useState({
    order_updates: true,
    promotions: true,
    newsletters: true,
  });
  const [saving, setSaving] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    setLoadingPrefs(true);
    try {
      const { data, error } = await supabase
        .from("email_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned, which is fine
        throw error;
      }

      if (data) {
        setPreferences({
          order_updates: data.order_updates ?? true,
          promotions: data.promotions ?? true,
          newsletters: data.newsletters ?? true,
        });
      }
    } catch (error: any) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoadingPrefs(false);
    }
  };

  const handleSave = async () => {
    if (!user || saving) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("email_preferences")
        .upsert(
          {
            user_id: user.id,
            order_updates: preferences.order_updates,
            promotions: preferences.promotions,
            newsletters: preferences.newsletters,
          },
          {
            onConflict: "user_id",
          }
        );

      if (error) throw error;

      toast.success("Email preferences updated!");
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingPrefs) {
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
          Email Preferences
        </h1>
        <p style={{ color: "#9ca3af", marginBottom: 30 }}>
          Choose which emails you'd like to receive from us.
        </p>

        <div
          style={{
            background: "#0f172a",
            border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  Order Updates
                </div>
                <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                  Receive notifications about your order status
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.order_updates}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    order_updates: e.target.checked,
                  })
                }
                style={{ width: 20, height: 20, cursor: "pointer" }}
              />
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  Promotions
                </div>
                <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                  Get notified about special offers and discounts
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.promotions}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    promotions: e.target.checked,
                  })
                }
                style={{ width: 20, height: 20, cursor: "pointer" }}
              />
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  Newsletter
                </div>
                <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                  Receive our monthly newsletter with product updates
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.newsletters}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    newsletters: e.target.checked,
                  })
                }
                style={{ width: 20, height: 20, cursor: "pointer" }}
              />
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              marginTop: 24,
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
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </main>
  );
}

