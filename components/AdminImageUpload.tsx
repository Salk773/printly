"use client";

import { useState } from "react";
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

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/upload-image", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${(await user.getSession()).access_token}`,
      },
      body: formData,
    });

    setUploading(false);
    e.target.value = "";

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Upload failed");
      return;
    }

    onUploaded(data.url);
  };

  return (
    <div style={{ marginTop: 8 }}>
      <input
        type="file"
        accept="image/*"
        onChange={upload}
        disabled={uploading}
      />
      {uploading && <p style={{ fontSize: "0.8rem" }}>Uploading…</p>}
    </div>
  );
}
