"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    // In a real application, you would send this to your backend API
    // For now, we'll use mailto as a fallback
    const mailtoLink = `mailto:info@printly.ae?subject=${encodeURIComponent(formData.subject || "Contact from Printly Website")}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    )}`;
    
    window.location.href = mailtoLink;
    
    toast.success("Opening your email client...");
    setLoading(false);
    
    // Reset form after a delay
    setTimeout(() => {
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1000);
  };

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
        color: "#e5e7eb",
      }}
    >
      <Link
        href="/"
        style={{
          color: "#94a3b8",
          fontSize: "0.9rem",
          textDecoration: "none",
          marginBottom: 20,
          display: "inline-block",
        }}
      >
        ← Back to Home
      </Link>

      <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: 12 }}>
        Contact Us
      </h1>
      <p style={{ color: "#94a3b8", marginBottom: 40, fontSize: "1rem" }}>
        Have a question or need assistance? We're here to help!
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 1fr)",
          gap: 40,
          marginBottom: 60,
        }}
        className="contact-grid"
      >
        {/* Contact Form */}
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 24 }}>
            Send us a Message
          </h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "#cbd5e1",
                }}
              >
                Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "#0f172a",
                  color: "white",
                  fontSize: "0.95rem",
                }}
                placeholder="Your name"
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "#cbd5e1",
                }}
              >
                Email <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "#0f172a",
                  color: "white",
                  fontSize: "0.95rem",
                }}
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "#cbd5e1",
                }}
              >
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "#0f172a",
                  color: "white",
                  fontSize: "0.95rem",
                }}
                placeholder="What's this about?"
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "#cbd5e1",
                }}
              >
                Message <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={6}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "#0f172a",
                  color: "white",
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
                placeholder="Tell us how we can help..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                marginTop: 8,
                padding: "14px 24px",
                fontSize: "1rem",
                width: "100%",
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        {/* Contact Information */}
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 24 }}>
            Get in Touch
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                background: "#0f172a",
                border: "1px solid rgba(148,163,184,0.2)",
                borderRadius: 16,
                padding: 24,
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 12, color: "#c084fc" }}>
                📧 Email
              </h3>
              <a
                href="mailto:info@printly.ae"
                style={{
                  color: "#cbd5e1",
                  textDecoration: "none",
                  fontSize: "0.95rem",
                }}
              >
                info@printly.ae
              </a>
            </div>

            <div
              style={{
                background: "#0f172a",
                border: "1px solid rgba(148,163,184,0.2)",
                borderRadius: 16,
                padding: 24,
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 12, color: "#c084fc" }}>
                📍 Location
              </h3>
              <p style={{ color: "#cbd5e1", fontSize: "0.95rem" }}>
                United Arab Emirates 🇦🇪
              </p>
            </div>

            <div
              style={{
                background: "#0f172a",
                border: "1px solid rgba(148,163,184,0.2)",
                borderRadius: 16,
                padding: 24,
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 12, color: "#c084fc" }}>
                ⏰ Response Time
              </h3>
              <p style={{ color: "#cbd5e1", fontSize: "0.95rem" }}>
                We typically respond within 24-48 hours during business days.
              </p>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, rgba(192,132,252,0.1), rgba(168,85,247,0.05))",
                border: "1px solid rgba(192,132,252,0.2)",
                borderRadius: 16,
                padding: 24,
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 12, color: "#c084fc" }}>
                💡 Need Help?
              </h3>
              <p style={{ color: "#cbd5e1", fontSize: "0.95rem", marginBottom: 12 }}>
                Check out our policies:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link
                  href="/privacy"
                  style={{
                    color: "#c084fc",
                    fontSize: "0.9rem",
                    textDecoration: "none",
                  }}
                >
                  → Privacy Policy
                </Link>
                <Link
                  href="/refund"
                  style={{
                    color: "#c084fc",
                    fontSize: "0.9rem",
                    textDecoration: "none",
                  }}
                >
                  → Refund Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

