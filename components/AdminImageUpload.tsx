"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminImageUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error } = await supabase.storage
      .from("uploads")
      .upload(filePath, file);

    if (error) {
      console.error(error);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("uploads")
      .getPublicUrl(filePath);

    onUploaded(data.publicUrl);
    setUploading(false);
  };

  return (
    <div>
      <input type="file" onChange={uploadImage} />

      {uploading && <p>Uploading…</p>}
    </div>
  );
}
