"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Props = {
  images: string[];
};

export default function HomepageCarousel({ images }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 5000);

    return () => clearInterval(id);
  }, [images.length]);

  const prev = () =>
    setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  return (
    <section
      style={{
        marginTop: 48,
        position: "relative",
        height: 504, // Increased by 20% (420 * 1.2 = 504)
        borderRadius: 20,
        overflow: "hidden",
      }}
      className="homepage-carousel"
    >
      {images.map((src, i) => (
        <div
          key={src}
          style={{
            position: "absolute",
            inset: 0,
            opacity: i === index ? 1 : 0,
            transition: "opacity 0.6s ease",
          }}
        >
          <Image
            src={src}
            alt="Announcement"
            fill
            style={{ objectFit: "cover" }}
            priority={i === 0}
          />

          {/* Overlay (optional text later) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))",
              display: "flex",
              alignItems: "flex-end",
              padding: 32,
              color: "white",
              fontSize: "1.4rem",
              fontWeight: 600,
            }}
          >
            {/* announcement text slot */}
          </div>
        </div>
      ))}

      {/* Arrows */}
      <button onClick={prev} style={arrowStyle("left")}>‹</button>
      <button onClick={next} style={arrowStyle("right")}>›</button>

      {/* Dots */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: i === index ? "white" : "rgba(255,255,255,0.4)",
              border: "none",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </section>
  );
}

const arrowStyle = (side: "left" | "right") => ({
  position: "absolute" as const,
  top: "50%",
  [side]: 16,
  transform: "translateY(-50%)",
  background: "rgba(0,0,0,0.4)",
  color: "white",
  border: "none",
  fontSize: 28,
  width: 42,
  height: 42,
  borderRadius: "50%",
  cursor: "pointer",
});
