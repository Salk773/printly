"use client";

import toast from "react-hot-toast";

interface SocialShareProps {
  productName: string;
  productUrl: string;
  productImage?: string;
  productDescription?: string;
}

export default function SocialShare({
  productName,
  productUrl,
  productImage,
  productDescription,
}: SocialShareProps) {
  const fullUrl = typeof window !== "undefined" 
    ? `${window.location.origin}${productUrl}`
    : productUrl;

  const shareText = `${productName}${productDescription ? ` - ${productDescription}` : ""}`;

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${fullUrl}`)}`,
    email: `mailto:?subject=${encodeURIComponent(productName)}&body=${encodeURIComponent(`${shareText}\n\n${fullUrl}`)}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    const url = shareLinks[platform];
    if (platform === "email") {
      window.location.href = url;
      return;
    }
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        marginTop: 20,
        paddingTop: 20,
        borderTop: "1px solid rgba(148,163,184,0.2)",
      }}
    >
      <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Share:</span>
      <button
        type="button"
        onClick={() => handleShare("facebook")}
        style={{
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid rgba(148,163,184,0.3)",
          background: "transparent",
          color: "#9ca3af",
          cursor: "pointer",
          fontSize: "0.85rem",
        }}
        title="Share on Facebook"
      >
        Facebook
      </button>
      <button
        type="button"
        onClick={() => void handleCopyLink()}
        style={{
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid rgba(148,163,184,0.3)",
          background: "transparent",
          color: "#9ca3af",
          cursor: "pointer",
          fontSize: "0.85rem",
        }}
        title="Copy product link"
      >
        Copy link
      </button>
      <button
        type="button"
        onClick={() => handleShare("whatsapp")}
        style={{
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid rgba(148,163,184,0.3)",
          background: "transparent",
          color: "#9ca3af",
          cursor: "pointer",
          fontSize: "0.85rem",
        }}
        title="Share on WhatsApp"
      >
        WhatsApp
      </button>
      <button
        type="button"
        onClick={() => handleShare("email")}
        style={{
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid rgba(148,163,184,0.3)",
          background: "transparent",
          color: "#9ca3af",
          cursor: "pointer",
          fontSize: "0.85rem",
        }}
        title="Share via Email"
      >
        Email
      </button>
    </div>
  );
}

