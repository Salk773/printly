"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthProvider";

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

    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const path = `products/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("uploads")
        .upload(path, file);

      if (error) {
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
      {uploading && <p>Uploading…</p>}
    </div>
  );
}
