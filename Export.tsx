/** Small formatting helpers shared across screens. */
export function money(n: number): string {
  if (!isFinite(n)) return "$0.00";
  if (n !== 0 && Math.abs(n) < 0.01) return "$" + n.toFixed(5);
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function num(n: number): string {
  return n.toLocaleString("en-US");
}
export function pct(n: number): string {
  return Math.round(n) + "%";
}
export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}
