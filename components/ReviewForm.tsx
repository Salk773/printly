"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthProvider";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface ReviewFormProps {
  productId: string;
  onSubmitted?: () => void;
}

export default function ReviewForm({ productId, onSubmitted }: ReviewFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div
        style={{
          padding: 20,
          background: "#0f172a",
          border: "1px solid rgba(148,163,184,0.2)",
          borderRadius: 16,
          marginTop: 24,
        }}
      >
        <p style={{ color: "#9ca3af", marginBottom: 12 }}>
          Please sign in to leave a review.
        </p>
        <button
          onClick={() => router.push("/auth/login")}
          style={{
            padding: "8px 16px",
            borderRadius: 999,
            border: "none",
            background: "linear-gradient(135deg, #c084fc, #a855f7)",
            color: "#020617",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("reviews").upsert(
        {
          product_id: productId,
          user_id: user.id,
          rating,
          comment: comment.trim() || null,
        },
        {
          onConflict: "product_id,user_id",
        }
      );

      if (error) throw error;

      toast.success("Review submitted!");
      setRating(0);
      setComment("");
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarInput = (starValue: number) => {
    const isFilled = starValue <= (hoverRating || rating);
    return (
      <button
        type="button"
        onClick={() => setRating(starValue)}
        onMouseEnter={() => setHoverRating(starValue)}
        onMouseLeave={() => setHoverRating(0)}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 4,
          fontSize: "1.5rem",
          color: isFilled ? "#fbbf24" : "#64748b",
          transition: "color 0.2s",
        }}
      >
        ★
      </button>
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: 24,
        background: "#0f172a",
        border: "1px solid rgba(148,163,184,0.2)",
        borderRadius: 16,
        marginTop: 24,
      }}
    >
      <h3 style={{ fontSize: "1.1rem", marginBottom: 16 }}>Write a Review</h3>

      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: "block",
            fontSize: "0.85rem",
            color: "#cbd5f5",
            marginBottom: 8,
          }}
        >
          Rating *
        </label>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((star) => renderStarInput(star))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: "block",
            fontSize: "0.85rem",
            color: "#cbd5f5",
            marginBottom: 8,
          }}
        >
          Comment (optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about this product..."
          style={{
            width: "100%",
            minHeight: 100,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(148,163,184,0.3)",
            background: "#020617",
            color: "white",
            resize: "vertical",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={submitting || rating === 0}
        style={{
          padding: "10px 20px",
          borderRadius: 999,
          border: "none",
          background:
            submitting || rating === 0
              ? "rgba(192,132,252,0.5)"
              : "linear-gradient(135deg, #c084fc, #a855f7)",
          color: "#020617",
          fontWeight: 600,
          cursor: submitting || rating === 0 ? "not-allowed" : "pointer",
          fontSize: "0.9rem",
        }}
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}

