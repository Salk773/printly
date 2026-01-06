"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthProvider";

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_email?: string;
}

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReviews(data || []);

      // Calculate average rating
      if (data && data.length > 0) {
        const sum = data.reduce((acc, review) => acc + review.rating, 0);
        setAverageRating(sum / data.length);
        setRatingCount(data.length);
      } else {
        setAverageRating(0);
        setRatingCount(0);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: "flex", gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              color: star <= rating ? "#fbbf24" : "#64748b",
              fontSize: "1.2rem",
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>
        Loading reviews...
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 40,
        padding: 24,
        background: "#0f172a",
        border: "1px solid rgba(148,163,184,0.2)",
        borderRadius: 16,
      }}
    >
      <h2 style={{ fontSize: "1.3rem", marginBottom: 20 }}>Reviews</h2>

      {/* Rating Summary */}
      {ratingCount > 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
            paddingBottom: 20,
            borderBottom: "1px solid rgba(148,163,184,0.2)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                color: "#c084fc",
              }}
            >
              {averageRating.toFixed(1)}
            </div>
            {renderStars(Math.round(averageRating))}
            <div style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: 4 }}>
              {ratingCount} review{ratingCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      ) : (
        <p style={{ color: "#9ca3af", marginBottom: 24 }}>
          No reviews yet. Be the first to review this product!
        </p>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {reviews.map((review) => (
            <div
              key={review.id}
              style={{
                padding: 16,
                background: "#020617",
                borderRadius: 12,
                border: "1px solid rgba(148,163,184,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {review.user_email
                      ? review.user_email.split("@")[0]
                      : "Anonymous"}
                  </div>
                  {renderStars(review.rating)}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>
              {review.comment && (
                <p style={{ color: "#cbd5f5", marginTop: 8, lineHeight: 1.6 }}>
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

