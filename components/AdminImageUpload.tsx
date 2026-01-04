"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthProvider";
import toast from "react-hot-toast";

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
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const path = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        toast.error(uploadError.message || "Image upload failed");
        return;
      }

      const { data } = supabase.storage
        .from("uploads")
        .getPublicUrl(path);

      if (!data?.publicUrl) {
        toast.error("Failed to get image URL");
        return;
      }

      onUploaded(data.publicUrl);
      toast.success("Image uploaded successfully");
    } catch (err) {
      console.error("Unexpected upload error:", err);
      toast.error("Unexpected upload error");
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
