"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminImageUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const ext = file.name.split(".").pop();
    const filename = `${Date.now()}.${ext}`;
    const path = `products/${filename}`;

    const { error } = await supabase.storage
      .from("uploads")
      .upload(path, file);

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
    setUploading(false);
  };

  return (
    <div>
      <input type="file" onChange={upload} />
      {uploading && <p style={{ fontSize: "0.8rem" }}>Uploading…</p>}
    </div>
  );
}
