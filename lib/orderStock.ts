import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

type OrderLine = { id?: string; quantity?: unknown };

function parseLines(items: unknown): OrderLine[] {
  return Array.isArray(items) ? (items as OrderLine[]) : [];
}

/**
 * Ensures each cart line does not exceed available stock when stock is tracked.
 */
export async function validateCartStock(
  admin: SupabaseClient,
  lines: Array<{ id: string; quantity: number }>
): Promise<{ ok: true } | { ok: false; message: string }> {
  for (const line of lines) {
    const q = Math.min(Math.max(1, Math.floor(Number(line.quantity))), 999);
    const { data: product, error } = await admin
      .from("products")
      .select("id, name, stock_quantity, active")
      .eq("id", line.id)
      .maybeSingle();

    if (error || !product || !product.active) {
      return { ok: false, message: "One or more products are unavailable." };
    }
    if (product.stock_quantity == null) continue;
    if (product.stock_quantity < q) {
      return {
        ok: false,
        message: `Not enough stock for "${product.name}". Available: ${product.stock_quantity}.`,
      };
    }
  }
  return { ok: true };
}

export async function decrementStockForOrderItems(
  admin: SupabaseClient,
  items: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  for (const line of parseLines(items)) {
    const productId = typeof line.id === "string" ? line.id : null;
    const qty = Math.min(Math.max(1, Math.floor(Number(line.quantity ?? 1))), 999);
    if (!productId) continue;

    const { data: product, error } = await admin
      .from("products")
      .select("id, stock_quantity")
      .eq("id", productId)
      .maybeSingle();

    if (error || !product) continue;
    if (product.stock_quantity == null) continue;

    const next = product.stock_quantity - qty;
    if (next < 0) {
      return { ok: false, error: `Insufficient stock for product ${productId}` };
    }

    const { error: upErr } = await admin
      .from("products")
      .update({ stock_quantity: next })
      .eq("id", productId);
    if (upErr) {
      return { ok: false, error: upErr.message };
    }
  }
  return { ok: true };
}

export async function incrementStockForOrderItems(
  admin: SupabaseClient,
  items: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  for (const line of parseLines(items)) {
    const productId = typeof line.id === "string" ? line.id : null;
    const qty = Math.min(Math.max(1, Math.floor(Number(line.quantity ?? 1))), 999);
    if (!productId) continue;

    const { data: product, error } = await admin
      .from("products")
      .select("id, stock_quantity")
      .eq("id", productId)
      .maybeSingle();

    if (error || !product) continue;
    if (product.stock_quantity == null) continue;

    const next = product.stock_quantity + qty;
    const { error: upErr } = await admin
      .from("products")
      .update({ stock_quantity: next })
      .eq("id", productId);
    if (upErr) {
      return { ok: false, error: upErr.message };
    }
  }
  return { ok: true };
}
