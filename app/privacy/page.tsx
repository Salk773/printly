import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description: "Printly Privacy Policy - How we collect, use, and protect your personal information",
};

export default function PrivacyPolicyPage() {
  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
        color: "#e5e7eb",
        lineHeight: 1.7,
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

      <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: 24 }}>
        Privacy Policy
      </h1>

      <p style={{ color: "#94a3b8", marginBottom: 32, fontSize: "0.95rem" }}>
        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            1. Introduction
          </h2>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            Welcome to Printly ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our website and in using our products and services.
          </p>
          <p style={{ color: "#cbd5e1" }}>
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website printly.ae or use our services.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            2. Information We Collect
          </h2>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 12, marginTop: 16 }}>
            Personal Information
          </h3>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            We may collect personal information that you voluntarily provide to us when you:
          </p>
          <ul style={{ color: "#cbd5e1", paddingLeft: 24, marginBottom: 12 }}>
            <li>Register for an account</li>
            <li>Place an order</li>
            <li>Subscribe to our newsletter</li>
            <li>Contact us for support</li>
            <li>Participate in surveys or promotions</li>
          </ul>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            This information may include:
          </p>
          <ul style={{ color: "#cbd5e1", paddingLeft: 24 }}>
            <li>Name and contact information (email address, phone number)</li>
            <li>Shipping and billing addresses</li>
            <li>Payment information (processed securely through third-party providers)</li>
            <li>Account credentials</li>
          </ul>

          <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 12, marginTop: 24 }}>
            Automatically Collected Information
          </h3>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            When you visit our website, we automatically collect certain information about your device, including:
          </p>
          <ul style={{ color: "#cbd5e1", paddingLeft: 24 }}>
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Pages you visit and time spent on pages</li>
            <li>Referring website addresses</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            3. How We Use Your Information
          </h2>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            We use the information we collect to:
          </p>
          <ul style={{ color: "#cbd5e1", paddingLeft: 24 }}>
            <li>Process and fulfill your orders</li>
            <li>Communicate with you about your orders, products, services, and promotional offers</li>
            <li>Improve our website, products, and services</li>
            <li>Personalize your shopping experience</li>
            <li>Detect and prevent fraud and abuse</li>
            <li>Comply with legal obligations</li>
            <li>Send you marketing communications (with your consent)</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            4. Information Sharing and Disclosure
          </h2>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            We do not sell your personal information. We may share your information only in the following circumstances:
          </p>
          <ul style={{ color: "#cbd5e1", paddingLeft: 24 }}>
            <li><strong>Service Providers:</strong> We may share information with third-party service providers who perform services on our behalf (e.g., payment processing, shipping, email delivery)</li>
            <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid requests by public authorities</li>
            <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred</li>
            <li><strong>With Your Consent:</strong> We may share your information with your explicit consent</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            5. Data Security
          </h2>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            6. Your Rights
          </h2>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            Depending on your location, you may have the following rights regarding your personal information:
          </p>
          <ul style={{ color: "#cbd5e1", paddingLeft: 24 }}>
            <li>Access to your personal information</li>
            <li>Correction of inaccurate information</li>
            <li>Deletion of your personal information</li>
            <li>Objection to processing of your information</li>
            <li>Data portability</li>
            <li>Withdrawal of consent</li>
          </ul>
          <p style={{ color: "#cbd5e1", marginTop: 12 }}>
            To exercise these rights, please contact us at{" "}
            <a href="mailto:info@printly.ae" style={{ color: "#c084fc", textDecoration: "none" }}>
              info@printly.ae
            </a>
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            7. Cookies and Tracking Technologies
          </h2>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            We use cookies and similar tracking technologies to track activity on our website and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            8. Children's Privacy
          </h2>
          <p style={{ color: "#cbd5e1" }}>
            Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            9. Changes to This Privacy Policy
          </h2>
          <p style={{ color: "#cbd5e1" }}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            10. Contact Us
          </h2>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <p style={{ color: "#cbd5e1" }}>
            Email:{" "}
            <a href="mailto:info@printly.ae" style={{ color: "#c084fc", textDecoration: "none" }}>
              info@printly.ae
            </a>
            <br />
            Website:{" "}
            <Link href="/contact" style={{ color: "#c084fc", textDecoration: "none" }}>
              Contact Page
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

