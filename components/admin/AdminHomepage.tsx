"use client";

import { useState, useEffect } from "react";
import AdminCard from "@/components/admin/AdminCard";
import AdminHomepageImageUpload from "@/components/AdminHomepageImageUpload";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function AdminHomepage({
  images,
  onDelete,
  onUploaded,
}: {
  images: string[];
  onDelete: (url: string) => void;
  onUploaded: () => void;
}) {
  const [bannerTitle, setBannerTitle] = useState("How Printly works");
  const [bannerDescription, setBannerDescription] = useState(
    "Curated ready-to-print designs in PLA+ and PETG."
  );
  const [savingBanner, setSavingBanner] = useState(false);
  const [loadingBanner, setLoadingBanner] = useState(true);

  // Load banner content on mount
  useEffect(() => {
    const loadBanner = async () => {
      try {
        const response = await fetch("/api/homepage/banner");
        if (response.ok) {
          const data = await response.json();
          setBannerTitle(data.title || "How Printly works");
          setBannerDescription(data.description || "Curated ready-to-print designs in PLA+ and PETG.");
        }
      } catch (error) {
        console.error("Error loading banner:", error);
      } finally {
        setLoadingBanner(false);
      }
    };

    loadBanner();
  }, []);

  const saveBanner = async () => {
    if (!bannerTitle.trim() || !bannerDescription.trim()) {
      toast.error("Title and description are required");
      return;
    }

    setSavingBanner(true);
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        toast.error("Not authenticated");
        return;
      }

      const token = session.data.session.access_token;
      const response = await fetch("/api/homepage/banner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: bannerTitle.trim(),
          description: bannerDescription.trim(),
        }),
      });

      if (response.ok) {
        toast.success("Banner updated successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update banner");
      }
    } catch (error: any) {
      console.error("Error saving banner:", error);
      toast.error("Failed to save banner");
    } finally {
      setSavingBanner(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Banner Content Editor */}
      <AdminCard maxWidth={760}>
        <h2 style={{ marginBottom: 16 }}>Homepage Banner</h2>
        <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginBottom: 16 }}>
          Edit the "How Printly works" banner content displayed on the homepage.
        </p>

        {loadingBanner ? (
          <p style={{ color: "#9ca3af" }}>Loading...</p>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  color: "#cbd5f5",
                  marginBottom: 6,
                }}
              >
                Title
              </label>
              <input
                type="text"
                value={bannerTitle}
                onChange={(e) => setBannerTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "#020617",
                  color: "white",
                  fontSize: "0.9rem",
                }}
                placeholder="How Printly works"
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  color: "#cbd5f5",
                  marginBottom: 6,
                }}
              >
                Description
              </label>
              <textarea
                value={bannerDescription}
                onChange={(e) => setBannerDescription(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "#020617",
                  color: "white",
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
                placeholder="Curated ready-to-print designs in PLA+ and PETG."
              />
            </div>

            <button
              onClick={saveBanner}
              disabled={savingBanner}
              className="btn-primary"
              style={{
                padding: "10px 20px",
                fontSize: "0.9rem",
                cursor: savingBanner ? "not-allowed" : "pointer",
                opacity: savingBanner ? 0.6 : 1,
              }}
            >
              {savingBanner ? "Saving..." : "Save Banner"}
            </button>
          </>
        )}
      </AdminCard>

      {/* Homepage Gallery */}
      <AdminCard maxWidth={760}>
        <h2 style={{ marginBottom: 12 }}>Homepage Gallery</h2>

        <AdminHomepageImageUpload onUploaded={onUploaded} />

      {images.length === 0 && (
        <p style={{ opacity: 0.6, marginTop: 10 }}>
          No homepage images uploaded yet.
        </p>
      )}

      {images.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 12,
            flexWrap: "wrap",
          }}
        >
          {images.map((url) => (
            <div
              key={url}
              style={{
                position: "relative",
                width: 140,
                height: 90,
              }}
            >
              <img
                src={url}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 8,
                }}
              />

              <button
                className="btn-danger"
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  padding: "2px 6px",
                  fontSize: 12,
                }}
                onClick={() => onDelete(url)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </AdminCard>
  );
}
