// Shared formatting helpers (client-safe)
export function formatINR(n: number): string {
  return "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n));
}

export function discountPct(price: number, mrp: number): number {
  if (mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function deliveryFeeFor(itemsTotal: number): number {
  return itemsTotal >= 999 ? 0 : 49;
}

export function timeAgoParts(iso: string | Date): { n: number; unit: "min" | "hr" | "day" } {
  const then = typeof iso === "string" ? new Date(iso).getTime() : iso.getTime();
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return { n: mins, unit: "min" };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { n: hrs, unit: "hr" };
  return { n: Math.floor(hrs / 24), unit: "day" };
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// Product images: JSON array of specs — v2 real photos {url}, v1 legacy gradients {g,e}
export type ProductImage = { url?: string; g?: string; e?: string };
export const PART_PLACEHOLDER = "/images/part-placeholder.svg";
export function parseImages(images: string): ProductImage[] {
  try {
    const arr = JSON.parse(images);
    if (Array.isArray(arr) && arr.length) return arr as ProductImage[];
  } catch {}
  return [{ url: PART_PLACEHOLDER }];
}

export const ORDER_FLOW = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;
export type OrderFlowStep = (typeof ORDER_FLOW)[number];
