"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminImageUpload({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed");
      return;
    }

    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const safeName = `${crypto.randomUUID()}.${ext}`;
      const path = `products/${safeName}`;

      const { error } = await supabase.storage
        .from("uploads")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error(error);
        alert("Upload failed");
        setUploading(false);
        return;
      }

      const { data } = supabase.storage
        .from("uploads")
        .getPublicUrl(path);

      onUploaded(data.publicUrl);
    } finally {
      setUploading(false);
      e.target.value = ""; // allow re-upload same file
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
