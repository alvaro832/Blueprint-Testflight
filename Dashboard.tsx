export type ContentKind = "prose" | "code" | "json" | "mixed";
export function detectKind(text: string): ContentKind {
  const t = text.trim();
  if (!t) return "prose";
  const looksJson = /^[\[{]/.test(t) && /[\]}]\s*$/.test(t);
  if (looksJson) return "json";
  const codeSignals = (t.match(/[;{}()=><]|=>|function|const |import |def |class /g) || []).length;
  const density = codeSignals / Math.max(1, t.length / 80);
  if (density > 1.4) return "code";
  if (codeSignals > 6) return "mixed";
  return "prose";
}
export function estimateTokens(text: string, kind?: ContentKind): number {
  if (!text) return 0;
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return 0;
  const chars = trimmed.length;
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const k = kind ?? detectKind(text);
  let est = (chars / 4) * 0.6 + words * 1.33 * 0.4;
  if (k === "code") est *= 1.18;
  else if (k === "json") est *= 1.22;
  else if (k === "mixed") est *= 1.08;
  return Math.max(1, Math.round(est));
}
