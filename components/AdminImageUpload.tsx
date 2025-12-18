const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setUploading(true);

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      alert("You are not logged in");
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

    const data = await res.json();

    if (!res.ok) {
      console.error(data);
      alert(data.error || "Upload failed");
      return;
    }

    onUploaded(data.url);
  } finally {
    setUploading(false);
    e.target.value = "";
  }
};
