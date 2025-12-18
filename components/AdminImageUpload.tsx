"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthProvider";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  onUploaded: (url: string) => void;
};

export default function AdminImageUpload({ onUploaded }: Props) {
  const { user, profile } = useAuth();
  const [uploading, setUploading] = useState(false);

  // 🔒 Admin-only guard
  if (!user || profile?.role !== "admin") {
    return null;
  }

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image files allowed");
      return;
    }

    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const filename = `${crypto.randomUUID()}.${ext}`;
      const path = `products/${filename}`;

      const { error } = await supabase.storage
        .from("uploads")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error(error);
        alert("Upload failed");
        return;
      }

      const { data } = supabase.storage
        .from("uploads")
        .getPublicUrl(path);

      onUploaded(data.publicUrl);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <input
        type="file"
        accept="image/*"
        onChange={upload}
        disabled={uploading}
      />

      {uploading && (
        <p style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
          Uploading…
        </p>
      )}
    </div>
  );
}
