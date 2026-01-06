import Link from "next/link";

export const metadata = {
  title: "Refund Policy",
  description: "Printly Refund Policy - Information about returns, refunds, and exchanges",
};

export default function RefundPolicyPage() {
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
        Refund Policy
      </h1>

      <p style={{ color: "#94a3b8", marginBottom: 32, fontSize: "0.95rem" }}>
        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            1. Overview
          </h2>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            At Printly, we strive to ensure your complete satisfaction with every purchase. This Refund Policy outlines the terms and conditions for returns, refunds, and exchanges of products purchased through our website.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            2. Return Eligibility
          </h2>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            To be eligible for a return, the following conditions must be met:
          </p>
          <ul style={{ color: "#cbd5e1", paddingLeft: 24 }}>
            <li>The item must be returned within <strong>14 days</strong> of delivery</li>
            <li>The item must be unused, in its original packaging, and in the same condition as when you received it</li>
            <li>The item must not be damaged, altered, or customized</li>
            <li>You must have proof of purchase (order number or receipt)</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            3. Non-Returnable Items
          </h2>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            The following items are not eligible for return:
          </p>
          <ul style={{ color: "#cbd5e1", paddingLeft: 24 }}>
            <li>Custom-made or personalized products</li>
            <li>Items that have been used, damaged, or altered</li>
            <li>Items without original packaging</li>
            <li>Digital products or downloadable content</li>
            <li>Items returned after the 14-day return period</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            4. How to Initiate a Return
          </h2>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            To initiate a return, please follow these steps:
          </p>
          <ol style={{ color: "#cbd5e1", paddingLeft: 24 }}>
            <li>Contact us at <a href="mailto:info@printly.ae" style={{ color: "#c084fc", textDecoration: "none" }}>info@printly.ae</a> or through our{" "}
              <Link href="/contact" style={{ color: "#c084fc", textDecoration: "none" }}>Contact Page</Link> with your order number</li>
            <li>Provide a reason for the return</li>
            <li>Wait for our confirmation and return authorization</li>
            <li>Package the item securely in its original packaging</li>
            <li>Ship the item back to the address we provide</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            5. Return Shipping
          </h2>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            Return shipping costs are the responsibility of the customer unless the return is due to:
          </p>
          <ul style={{ color: "#cbd5e1", paddingLeft: 24 }}>
            <li>Defective or damaged items</li>
            <li>Wrong item received</li>
            <li>Our error in processing your order</li>
          </ul>
          <p style={{ color: "#cbd5e1", marginTop: 12 }}>
            In such cases, we will provide a prepaid return shipping label or reimburse your return shipping costs.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            6. Refund Process
          </h2>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            Once we receive and inspect your returned item, we will:
          </p>
          <ol style={{ color: "#cbd5e1", paddingLeft: 24 }}>
            <li>Notify you via email that we have received your return</li>
            <li>Inspect the item to ensure it meets our return criteria</li>
            <li>Process your refund within <strong>5-7 business days</strong> after approval</li>
            <li>Issue the refund to your original payment method</li>
          </ol>
          <p style={{ color: "#cbd5e1", marginTop: 12 }}>
            Please note that it may take additional time for your bank or credit card company to process the refund and show it in your account.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            7. Refund Amount
          </h2>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            Refunds will be issued for the purchase price of the item(s) returned. The following may be deducted from your refund:
          </p>
          <ul style={{ color: "#cbd5e1", paddingLeft: 24 }}>
            <li>Original shipping costs (unless the return is due to our error)</li>
            <li>Any discounts or promotional codes applied to the original order</li>
            <li>Restocking fees (if applicable, will be clearly stated)</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            8. Exchanges
          </h2>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            We currently do not offer direct exchanges. If you wish to exchange an item:
          </p>
          <ol style={{ color: "#cbd5e1", paddingLeft: 24 }}>
            <li>Return the original item following our return process</li>
            <li>Place a new order for the desired item</li>
            <li>Your refund will be processed once we receive the returned item</li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            9. Damaged or Defective Items
          </h2>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            If you receive a damaged or defective item:
          </p>
          <ul style={{ color: "#cbd5e1", paddingLeft: 24 }}>
            <li>Contact us immediately (within 48 hours of delivery) with photos of the damage</li>
            <li>We will arrange for a replacement or full refund at no cost to you</li>
            <li>We may request that you return the damaged item for quality control purposes</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            10. Cancellations
          </h2>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            You may cancel your order before it is shipped. Once an order has been shipped, our standard return policy applies.
          </p>
          <p style={{ color: "#cbd5e1" }}>
            To cancel an order, contact us as soon as possible at{" "}
            <a href="mailto:info@printly.ae" style={{ color: "#c084fc", textDecoration: "none" }}>
              info@printly.ae
            </a> with your order number.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16, color: "#c084fc" }}>
            11. Contact Us
          </h2>
          <p style={{ color: "#cbd5e1", marginBottom: 12 }}>
            If you have any questions about our Refund Policy, please contact us:
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

