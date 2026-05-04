/**
 * Display order: paid → processing → pending → completed → others.
 * Within the same status, newest first (created_at descending).
 */
const STATUS_RANK: Record<string, number> = {
  paid: 0,
  processing: 1,
  pending: 2,
  completed: 3,
  cancelled: 90,
  refunded: 91,
};

export function compareOrdersByStatusThenNewest<
  T extends { status: string; created_at: string },
>(a: T, b: T): number {
  const ra = STATUS_RANK[a.status] ?? 50;
  const rb = STATUS_RANK[b.status] ?? 50;
  if (ra !== rb) return ra - rb;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

export function sortOrdersForDisplay<
  T extends { status: string; created_at: string },
>(orders: T[]): T[] {
  return [...orders].sort(compareOrdersByStatusThenNewest);
}
