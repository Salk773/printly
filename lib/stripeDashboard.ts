/** Client-safe Stripe Dashboard URLs (uses publishable key for test/live mode). */
export function isStripeTestMode(): boolean {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test") ?? true;
}

function prefix(): string {
  return isStripeTestMode() ? "test/" : "";
}

/** Payment / PaymentIntent detail page in Stripe Dashboard */
export function stripePaymentDashboardUrl(paymentIntentId: string): string {
  return `https://dashboard.stripe.com/${prefix()}payments/${encodeURIComponent(paymentIntentId)}`;
}

export function stripeCheckoutSessionDashboardUrl(sessionId: string): string {
  return `https://dashboard.stripe.com/${prefix()}checkout/sessions/${encodeURIComponent(sessionId)}`;
}
