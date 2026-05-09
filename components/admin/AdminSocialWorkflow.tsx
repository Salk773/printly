"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import { getErrorMessage } from "@/lib/errorMessage";
import type {
  CreativeRendition,
  CreativeWorkflowItem,
  SocialPost,
} from "@/lib/creative/types";

type PostDraft = {
  caption: string;
  hashtags: string;
};

function getExtension(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext && ext.length <= 5 ? ext : "jpg";
}

function platformLabel(platform: string) {
  return platform === "tiktok" ? "TikTok" : "Instagram";
}

function statusColor(status: string) {
  if (status === "published") return "#166534";
  if (status === "failed") return "#991b1b";
  if (status === "approved") return "#1d4ed8";
  if (status === "waiting_approval") return "#92400e";
  return "#374151";
}

export default function AdminSocialWorkflow() {
  const [assets, setAssets] = useState<CreativeWorkflowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, PostDraft>>({});

  const getToken = useCallback(async () => {
    const session = await supabase.auth.getSession();
    return session.data.session?.access_token ?? null;
  }, []);

  const apiFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const token = await getToken();
      if (!token) throw new Error("You must be signed in as an admin.");

      const response = await fetch(path, {
        ...init,
        headers: {
          ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
          Authorization: `Bearer ${token}`,
          ...(init?.headers || {}),
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(getErrorMessage(data.error ?? data, "Request failed"));
      }
      return data;
    },
    [getToken]
  );

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/admin/creative-workflow");
      setAssets(data.assets || []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load workflow"));
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    const nextDrafts: Record<string, PostDraft> = {};
    for (const asset of assets) {
      for (const post of asset.social_posts || []) {
        nextDrafts[post.id] = {
          caption: drafts[post.id]?.caption ?? post.selected_caption,
          hashtags:
            drafts[post.id]?.hashtags ?? (post.selected_hashtags || []).join(" "),
        };
      }
    }
    setDrafts(nextDrafts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]);

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("You must be signed in as an admin.");

      for (const file of Array.from(files)) {
        const validationForm = new FormData();
        validationForm.append("file", file);
        await apiFetch("/api/upload/validate", {
          method: "POST",
          body: validationForm,
        });

        const path = `creative/originals/${crypto.randomUUID()}.${getExtension(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(path, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("uploads").getPublicUrl(path);
        if (!data.publicUrl) throw new Error("Failed to create public image URL.");

        await apiFetch("/api/admin/creative-workflow/upload", {
          method: "POST",
          body: JSON.stringify({
            original_filename: file.name,
            storage_bucket: "uploads",
            storage_path: path,
            public_url: data.publicUrl,
            content_type: file.type,
            file_size: file.size,
          }),
        });
      }

      toast.success("Upload registered");
      await loadAssets();
    } catch (error) {
      toast.error(getErrorMessage(error, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const runAction = async (
    id: string,
    action: () => Promise<void>,
    successMessage: string
  ) => {
    setBusyId(id);
    try {
      await action();
      toast.success(successMessage);
      await loadAssets();
    } catch (error) {
      toast.error(getErrorMessage(error, "Action failed"));
    } finally {
      setBusyId(null);
    }
  };

  const processAsset = (assetId: string) =>
    runAction(
      assetId,
      async () => {
        await apiFetch("/api/admin/creative-workflow/process", {
          method: "POST",
          body: JSON.stringify({ assetId }),
        });
      },
      "Asset processed"
    );

  const approvePost = (post: SocialPost) =>
    runAction(
      post.id,
      async () => {
        const draft = drafts[post.id];
        await apiFetch("/api/admin/creative-workflow/approve", {
          method: "POST",
          body: JSON.stringify({
            postId: post.id,
            caption: draft?.caption || post.selected_caption,
            hashtags: (draft?.hashtags || "")
              .split(/\s+/)
              .map((tag) => tag.trim())
              .filter(Boolean),
            selectedAudio: post.selected_audio,
          }),
        });
      },
      `${platformLabel(post.platform)} post approved`
    );

  const publishPost = (post: SocialPost) =>
    runAction(
      post.id,
      async () => {
        await apiFetch("/api/admin/creative-workflow/publish", {
          method: "POST",
          body: JSON.stringify({ postId: post.id }),
        });
      },
      `${platformLabel(post.platform)} post sent to publisher`
    );

  const emptyState = useMemo(
    () => !loading && assets.length === 0,
    [assets.length, loading]
  );

  return (
    <section>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-start",
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div>
          <h2>AI Social Publishing Workflow</h2>
          <p style={{ color: "#555", maxWidth: 760 }}>
            Upload product pictures, generate edited assets and captions, approve
            platform posts, then publish through the configured scheduler adapter.
          </p>
        </div>
        <label
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "10px 14px",
            cursor: uploading ? "not-allowed" : "pointer",
            background: uploading ? "#f3f4f6" : "#fff",
          }}
        >
          {uploading ? "Uploading..." : "Upload pictures"}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            style={{ display: "none" }}
            onChange={(event) => {
              uploadFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {loading && <p>Loading workflow...</p>}
      {emptyState && <p>No creative assets yet. Upload pictures to begin.</p>}

      <div style={{ display: "grid", gap: 18 }}>
        {assets.map((asset) => {
          const edited = (asset.creative_renditions || []).find(
            (rendition) => rendition.rendition_type === "edited"
          );
          const socialPosts = asset.social_posts || [];

          return (
            <article
              key={asset.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 16,
                background: "#fff",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(180px, 260px) 1fr",
                  gap: 18,
                }}
              >
                <div>
                  <img
                    src={edited?.public_url || asset.public_url}
                    alt={asset.original_filename}
                    style={{
                      width: "100%",
                      borderRadius: 10,
                      border: "1px solid #eee",
                      objectFit: "cover",
                    }}
                  />
                  <p style={{ fontSize: 13, color: "#555", wordBreak: "break-word" }}>
                    {asset.original_filename}
                  </p>
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h3 style={{ marginTop: 0 }}>Creative asset</h3>
                      <p style={{ margin: "4px 0", color: statusColor(asset.status) }}>
                        Status: {asset.status}
                      </p>
                      {asset.error_message && (
                        <p style={{ color: "#991b1b" }}>{asset.error_message}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={busyId === asset.id || asset.status === "processing"}
                      onClick={() => processAsset(asset.id)}
                    >
                      {busyId === asset.id ? "Processing..." : "Process / regenerate"}
                    </button>
                  </div>

                  <GeneratedCopy asset={asset} />

                  <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
                    {socialPosts.map((post) => (
                      <PostApprovalCard
                        key={post.id}
                        post={post}
                        rendition={(asset.creative_renditions || []).find(
                          (item) => item.id === post.rendition_id
                        )}
                        draft={drafts[post.id]}
                        busy={busyId === post.id}
                        onDraftChange={(draft) =>
                          setDrafts((current) => ({ ...current, [post.id]: draft }))
                        }
                        onApprove={() => approvePost(post)}
                        onPublish={() => publishPost(post)}
                      />
                    ))}
                    {asset.status === "ready" && socialPosts.length === 0 && (
                      <p>No social posts were generated for this asset.</p>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function GeneratedCopy({ asset }: { asset: CreativeWorkflowItem }) {
  const imageDescription = (asset.creative_descriptions || []).find(
    (description) => description.description_type === "image"
  );

  if (!imageDescription) return null;

  return (
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #eee",
        borderRadius: 8,
        padding: 12,
        marginTop: 10,
      }}
    >
      <strong>{imageDescription.title}</strong>
      <p style={{ marginBottom: 0 }}>{imageDescription.description}</p>
    </div>
  );
}

function PostApprovalCard({
  post,
  rendition,
  draft,
  busy,
  onDraftChange,
  onApprove,
  onPublish,
}: {
  post: SocialPost;
  rendition?: CreativeRendition;
  draft?: PostDraft;
  busy: boolean;
  onDraftChange: (draft: PostDraft) => void;
  onApprove: () => void;
  onPublish: () => void;
}) {
  const caption = draft?.caption ?? post.selected_caption;
  const hashtags = draft?.hashtags ?? post.selected_hashtags.join(" ");

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
        <div>
          <h4 style={{ margin: "0 0 6px" }}>{platformLabel(post.platform)}</h4>
          <p style={{ margin: 0, color: statusColor(post.status) }}>
            Status: {post.status}
          </p>
        </div>
        {rendition && (
          <span style={{ color: "#555", fontSize: 13 }}>
            {rendition.width} x {rendition.height}
          </span>
        )}
      </div>

      <label style={{ display: "block", marginTop: 10 }}>
        Caption
        <textarea
          value={caption}
          rows={4}
          onChange={(event) =>
            onDraftChange({ caption: event.target.value, hashtags })
          }
          style={{ width: "100%", marginTop: 4 }}
        />
      </label>

      <label style={{ display: "block", marginTop: 10 }}>
        Prioritized hashtags
        <input
          value={hashtags}
          onChange={(event) =>
            onDraftChange({ caption, hashtags: event.target.value })
          }
          style={{ width: "100%", marginTop: 4 }}
        />
      </label>

      {post.selected_audio && (
        <p style={{ color: "#555", fontSize: 13 }}>
          Audio suggestion: <strong>{post.selected_audio.label}</strong> -{" "}
          {post.selected_audio.usage_note}
        </p>
      )}

      {post.error_message && <p style={{ color: "#991b1b" }}>{post.error_message}</p>}

      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={busy || post.status === "published"}
          onClick={onApprove}
        >
          {busy ? "Working..." : "Approve"}
        </button>
        <button
          type="button"
          disabled={busy || (post.status !== "approved" && post.status !== "failed")}
          onClick={onPublish}
        >
          Publish
        </button>
      </div>
    </div>
  );
}
