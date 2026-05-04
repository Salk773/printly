/**
 * Distributes a discount (minor units, e.g. fils) across Stripe Checkout product lines only.
 * Shipping must not be included in `lines`.
 */
export function applyDiscountMinorToProductLineItems(
  lines: Array<{
    price_data: { unit_amount: number };
    quantity: number;
  }>,
  discountMinor: number
): void {
  if (discountMinor <= 0 || lines.length === 0) return;

  const lineMinors = lines.map((l) => l.price_data.unit_amount * l.quantity);
  const sumBefore = lineMinors.reduce((a, b) => a + b, 0);
  if (sumBefore === 0) return;

  const take = Math.min(discountMinor, sumBefore);
  const sumAfter = sumBefore - take;

  const newLineMinors: number[] = [];
  let allocated = 0;
  for (let i = 0; i < lines.length; i++) {
    if (i < lines.length - 1) {
      const nm = Math.floor((sumAfter * lineMinors[i]) / sumBefore);
      newLineMinors.push(nm);
      allocated += nm;
    } else {
      newLineMinors.push(sumAfter - allocated);
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const q = lines[i].quantity;
    const nm = newLineMinors[i];
    lines[i].price_data.unit_amount = Math.max(1, Math.round(nm / q));
  }

  let actual = lines.reduce((s, l) => s + l.price_data.unit_amount * l.quantity, 0);
  let drift = sumAfter - actual;
  let guard = 0;
  while (drift !== 0 && guard < 12 && lines.length > 0) {
    const last = lines[lines.length - 1];
    const step = drift > 0 ? 1 : -1;
    last.price_data.unit_amount = Math.max(1, last.price_data.unit_amount + step);
    actual = lines.reduce((s, l) => s + l.price_data.unit_amount * l.quantity, 0);
    drift = sumAfter - actual;
    guard++;
  }
}
