/** UAE emirates (official English names). */
export const UAE_EMIRATES = [
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
] as const;

export type UaeEmirate = (typeof UAE_EMIRATES)[number];

/** Match saved DB values to a canonical emirate name when possible. */
export function normalizeUaeEmirate(input: string | null | undefined): string {
  const t = (input ?? "").trim();
  if (!t) return "";
  const found = UAE_EMIRATES.find((e) => e.toLowerCase() === t.toLowerCase());
  return found ?? "";
}
