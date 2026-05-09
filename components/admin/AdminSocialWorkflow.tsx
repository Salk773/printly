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

type ActivityEntry = {
  id: string;
  message: string;
  tone: "info" | "success" | "error";
  createdAt: string;
};

function getExtension(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext && ext.length <= 5 ? ext : "jpg";
}

function platformLabel(platform: string) {
  return platform === "tiktok" ? "TikTok" : "Instagram";
}

function statusColor(status: string) {
  if (status === "published") return "#22c55e";
  if (status === "failed") return "#f87171";
  if (status === "approved") return "#93c5fd";
  if (status === "waiting_approval") return "#fbbf24";
  if (status === "processing" || status === "publishing") return "#c084fc";
  return "#94a3b8";
}

export default function AdminSocialWorkflow() {
  const [assets, setAssets] = useState<CreativeWorkflowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [setupSql, setSetupSql] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, PostDraft>>({});
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  const addActivity = useCallback((message: string, tone: ActivityEntry["tone"] = "info") => {
    setActivity((current) => [
      {
        id: crypto.randomUUID(),
        message,
        tone,
        createdAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
      ...current,
    ].slice(0, 12));
  }, []);

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
      addActivity("Loading creative workflow queue...");
      const data = await apiFetch("/api/admin/creative-workflow");
      setAssets(data.assets || []);
      setLoadError(null);
      setSetupSql(null);
      addActivity("Workflow queue loaded", "success");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load workflow");
      setLoadError(message);
      addActivity(message, "error");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [addActivity, apiFetch]);

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
        addActivity(`Validating ${file.name}...`);
        const validationForm = new FormData();
        validationForm.append("file", file);
        await apiFetch("/api/upload/validate", {
          method: "POST",
          body: validationForm,
        });

        const path = `creative/originals/${crypto.randomUUID()}.${getExtension(file.name)}`;
        addActivity(`Uploading ${file.name} to Supabase Storage...`);
        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(path, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("uploads").getPublicUrl(path);
        if (!data.publicUrl) throw new Error("Failed to create public image URL.");

        addActivity(`Registering ${file.name} in the workflow queue...`);
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

      addActivity("Upload complete. Next step: process the asset.", "success");
      toast.success("Upload registered");
      await loadAssets();
    } catch (error) {
      const message = getErrorMessage(error, "Upload failed");
      addActivity(message, "error");
      toast.error(message);
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

  const runDatabaseSetup = async () => {
    setBusyId("schema-setup");
    try {
      addActivity("Checking database setup...");
      const data = await apiFetch("/api/admin/schema/creative-workflow", {
        method: "POST",
      });

      if (data.success) {
        addActivity("Database setup completed", "success");
        toast.success(data.message || "Database schema is ready");
        await loadAssets();
        return;
      }

      if (data.sql) {
        setSetupSql(data.sql);
        addActivity("Database credentials missing. SQL is ready to copy.", "error");
      }

      toast.error(
        data.message ||
          "Database credentials are missing. Copy the SQL below into Supabase SQL Editor."
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to run database setup"));
    } finally {
      setBusyId(null);
    }
  };

  const processAsset = (assetId: string) =>
    runAction(
      assetId,
      async () => {
        addActivity("Starting AI edit, description, social format, and trend steps...");
        await apiFetch("/api/admin/creative-workflow/process", {
          method: "POST",
          body: JSON.stringify({ assetId }),
        });
        addActivity("Processing complete. Review and approve the social drafts.", "success");
      },
      "Asset processed"
    );

  const approvePost = (post: SocialPost) =>
    runAction(
      post.id,
      async () => {
        const draft = drafts[post.id];
        addActivity(`Approving ${platformLabel(post.platform)} caption and tags...`);
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
        addActivity(`${platformLabel(post.platform)} draft approved`, "success");
      },
      `${platformLabel(post.platform)} post approved`
    );

  const publishPost = (post: SocialPost) =>
    runAction(
      post.id,
      async () => {
        addActivity(`Sending ${platformLabel(post.platform)} post to publishing adapter...`);
        await apiFetch("/api/admin/creative-workflow/publish", {
          method: "POST",
          body: JSON.stringify({ postId: post.id }),
        });
        addActivity(`${platformLabel(post.platform)} publish request finished`, "success");
      },
      `${platformLabel(post.platform)} post sent to publisher`
    );

  const copySetupSql = async () => {
    if (!setupSql) return;
    try {
      await navigator.clipboard.writeText(setupSql);
      toast.success("Setup SQL copied");
    } catch {
      toast.error("Could not copy SQL automatically. Select and copy it manually.");
    }
  };

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
          <p style={{ color: "#94a3b8", maxWidth: 760 }}>
            Upload product pictures, let the workflow create edited images,
            descriptions, social drafts, ranked tags, and audio ideas, then approve
            what should be published.
          </p>
        </div>
        <label
          className="btn-primary"
          style={{
            border: "none",
            borderRadius: 12,
            padding: "12px 18px",
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.7 : 1,
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(260px, 0.65fr)",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <WorkflowExplainer />
        <ProgressPanel loading={loading || uploading || Boolean(busyId)} activity={activity} />
      </div>

      {loading && <p>Loading workflow...</p>}
      {loadError && (
        <div
          style={{
            border: "1px solid #92400e",
            background: "rgba(146, 64, 14, 0.18)",
            borderRadius: 10,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <strong>Database setup needed</strong>
          <p style={{ margin: "8px 0 12px" }}>{loadError}</p>
          <button
            type="button"
            disabled={busyId === "schema-setup"}
            onClick={runDatabaseSetup}
          >
            {busyId === "schema-setup" ? "Running setup..." : "Run database setup"}
          </button>
          {setupSql && (
            <div style={{ marginTop: 14 }}>
              <p style={{ margin: "0 0 8px", color: "#555" }}>
                Your app cannot connect directly to the database yet. Copy this SQL,
                run it in Supabase SQL Editor, then refresh this page.
              </p>
              <button type="button" onClick={copySetupSql} style={{ marginBottom: 8 }}>
                Copy SQL
              </button>
              <textarea
                readOnly
                value={setupSql}
                rows={12}
                style={{
                  width: "100%",
                  fontFamily: "monospace",
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  padding: 10,
                }}
              />
            </div>
          )}
        </div>
      )}
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
              className="card-soft"
              style={{
                borderRadius: 12,
                padding: 16,
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
                      border: "1px solid rgba(148,163,184,0.25)",
                      objectFit: "cover",
                    }}
                  />
                  <p style={{ fontSize: 13, color: "#94a3b8", wordBreak: "break-word" }}>
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
                      className="btn-primary"
                      type="button"
                      disabled={busyId === asset.id || asset.status === "processing"}
                      onClick={() => processAsset(asset.id)}
                    >
                      {busyId === asset.id ? "Processing..." : "Process / regenerate"}
                    </button>
                  </div>

                  <AssetProgress asset={asset} />

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

function WorkflowExplainer() {
  const steps = [
    {
      title: "1. Upload",
      text: "Store the original picture in Supabase and add it to the creative queue.",
    },
    {
      title: "2. Generate",
      text: "Create an edited image, image description, platform captions, tags, and audio ideas.",
    },
    {
      title: "3. Approve",
      text: "Review the Instagram and TikTok drafts, edit the caption or hashtags, then approve.",
    },
    {
      title: "4. Publish",
      text: "Send approved posts to the scheduler adapter or keep them as internal drafts until connected.",
    },
  ];

  return (
    <div className="card-soft" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>How it works</h3>
      <div style={{ display: "grid", gap: 10 }}>
        {steps.map((step) => (
          <div
            key={step.title}
            style={{
              border: "1px solid rgba(148,163,184,0.18)",
              borderRadius: 12,
              padding: 12,
              background: "rgba(2,6,23,0.45)",
            }}
          >
            <strong style={{ color: "#c084fc" }}>{step.title}</strong>
            <p style={{ margin: "4px 0 0", color: "#cbd5e1", fontSize: 13 }}>
              {step.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressPanel({
  loading,
  activity,
}: {
  loading: boolean;
  activity: ActivityEntry[];
}) {
  return (
    <div className="card-soft" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>Live progress</h3>
      <p style={{ margin: "0 0 12px", color: "#94a3b8", fontSize: 13 }}>
        {loading
          ? "A workflow action is running. Watch each step appear below."
          : "No action running right now."}
      </p>
      <div style={{ display: "grid", gap: 8, maxHeight: 260, overflowY: "auto" }}>
        {activity.length === 0 ? (
          <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
            Upload or process an image to see progress here.
          </p>
        ) : (
          activity.map((entry) => (
            <div
              key={entry.id}
              style={{
                border: "1px solid rgba(148,163,184,0.16)",
                borderRadius: 10,
                padding: 10,
                background:
                  entry.tone === "error"
                    ? "rgba(127,29,29,0.25)"
                    : entry.tone === "success"
                      ? "rgba(22,101,52,0.18)"
                      : "rgba(15,23,42,0.7)",
              }}
            >
              <div style={{ color: "#94a3b8", fontSize: 11 }}>{entry.createdAt}</div>
              <div style={{ color: "#e5e7eb", fontSize: 13 }}>{entry.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AssetProgress({ asset }: { asset: CreativeWorkflowItem }) {
  const hasEdited = (asset.creative_renditions || []).some(
    (rendition) => rendition.rendition_type === "edited"
  );
  const socialPosts = asset.social_posts || [];
  const hasDrafts = socialPosts.length > 0;
  const approved = socialPosts.some((post) => post.status === "approved" || post.status === "published");
  const published = socialPosts.some((post) => post.status === "published" || post.status === "draft");

  const stages = [
    { label: "Uploaded", done: true },
    { label: "Edited", done: hasEdited || asset.status === "ready" },
    { label: "Social drafts", done: hasDrafts },
    { label: "Approved", done: approved },
    { label: "Published/Drafted", done: published },
  ];

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
      {stages.map((stage) => (
        <span
          key={stage.label}
          style={{
            border: `1px solid ${stage.done ? "rgba(192,132,252,0.55)" : "rgba(148,163,184,0.22)"}`,
            borderRadius: 999,
            padding: "5px 9px",
            color: stage.done ? "#e9d5ff" : "#94a3b8",
            background: stage.done ? "rgba(192,132,252,0.14)" : "rgba(15,23,42,0.55)",
            fontSize: 12,
          }}
        >
          {stage.done ? "✓ " : ""}
          {stage.label}
        </span>
      ))}
    </div>
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
        background: "rgba(15,23,42,0.7)",
        border: "1px solid rgba(148,163,184,0.18)",
        borderRadius: 8,
        padding: 12,
        marginTop: 10,
      }}
    >
      <strong>{imageDescription.title}</strong>
      <p style={{ marginBottom: 0, color: "#cbd5e1" }}>{imageDescription.description}</p>
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
        border: "1px solid rgba(148,163,184,0.22)",
        borderRadius: 10,
        padding: 12,
        background: "rgba(2,6,23,0.38)",
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
          <span style={{ color: "#94a3b8", fontSize: 13 }}>
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
          className="textarea"
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
          className="input"
          style={{ width: "100%", marginTop: 4 }}
        />
      </label>

      {post.selected_audio && (
        <p style={{ color: "#94a3b8", fontSize: 13 }}>
          Audio suggestion: <strong>{post.selected_audio.label}</strong> -{" "}
          {post.selected_audio.usage_note}
        </p>
      )}

      {post.error_message && <p style={{ color: "#991b1b" }}>{post.error_message}</p>}

      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <button
          className="btn-primary"
          type="button"
          disabled={busy || post.status === "published"}
          onClick={onApprove}
        >
          {busy ? "Working..." : "Approve"}
        </button>
        <button
          className="btn-ghost"
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
