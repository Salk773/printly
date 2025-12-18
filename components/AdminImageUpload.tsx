"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthProvider";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminImageUpload({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed");
      e.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Not authenticated");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error(json);
        alert("Upload failed");
        return;
      }

      const rawUrl = json?.url || json?.publicUrl || json?.data?.publicUrl;
      if (!rawUrl) {
        console.error("Upload API returned no URL", json);
        alert("Upload failed (no URL returned)");
        return;
      }

      // Bust cache so you don't see an old 0-byte object / stale CDN response
      const url = `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;

      onUploaded(url);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <input type="file" accept="image/*" onChange={upload} disabled={uploading} />
      {uploading && <p style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Uploading…</p>}
    </div>
  );
}
