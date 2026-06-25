import { detectKind, estimateTokens, type ContentKind } from "./tokens";
import { callCost, getModel, routeTask, MODELS, type ModelSpec, type RoutingResult } from "./pricing";

export interface WasteItem {
  type: "filler" | "redundancy" | "verbosity" | "whitespace" | "examples" | "politeness";
  label: string; detail: string; tokensSaved: number;
}
export interface ClarityFlag { label: string; suggestion: string; }
export interface OptimizeOptions {
  modelId?: string; expectedOutputTokens?: number; monthlyRuns?: number;
  level?: "balanced" | "aggressive" | "clarity" | "reduce";
}
export interface OptimizeResult {
  original: string; optimized: string; kind: ContentKind;
  originalTokens: number; optimizedTokens: number; tokensSaved: number;
  compressionPct: number; qualityRisk: number; qualityRiskLabel: "Low" | "Moderate" | "Elevated";
  waste: WasteItem[]; clarityFlags: ClarityFlag[];
  savedPerCall: number; savedPerMonth: number; savedPerYear: number; routing: RoutingResult;
  /** 0-100 readability of the optimized text (higher = easier to read) */
  readability: number;
  /** 0-100 confidence the meaning is preserved (100 - qualityRisk) */
  qualityConfidence: number;
}
const FILLER_PATTERNS: { re: RegExp; type: WasteItem["type"]; label: string }[] = [
  { re: /\bi would really appreciate it if you could\b/gi, type: "politeness", label: "Appreciation padding" },
  { re: /\bthank you( so much| very much| in advance| a lot)?( for (your help|this|everything|that)( with this( task)?)?)?!*/gi, type: "politeness", label: "Closing thanks" },
  { re: /\bthanks( (a lot|so much|again|in advance))?!*/gi, type: "politeness", label: "Thanks" },
  { re: /\bplease could you\b/gi, type: "verbosity", label: "Indirect request" },
  { re: /\bi would like you to\b/gi, type: "verbosity", label: "Indirect request" },
  { re: /\bi want you to\b/gi, type: "verbosity", label: "Indirect request" },
  { re: /\bi need you to\b/gi, type: "verbosity", label: "Indirect request" },
  { re: /\bplease make sure (that |to )?/gi, type: "filler", label: "Emphatic filler" },
  { re: /\bplease do not forget to\b/gi, type: "filler", label: "Emphatic filler" },
  { re: /\bit is (very |really )?important that you\b/gi, type: "filler", label: "Emphatic filler" },
  { re: /\bmake sure (that |to )?you\b/gi, type: "filler", label: "Emphatic filler" },
  { re: /\b(very )?carefully (read|review|analyze|consider)( through)?\b/gi, type: "filler", label: "Emphatic adverb" },
  { re: /\bread through (the )?(following )?\b/gi, type: "verbosity", label: "Wordy lead-in" },
  { re: /\bthat we (have )?received\b/gi, type: "verbosity", label: "Wordy aside" },
  { re: /\bfrom one of our valued customers\b/gi, type: "verbosity", label: "Wordy aside" },
  { re: /\bone of our valued customers\b/gi, type: "verbosity", label: "Wordy aside" },
  { re: /\bas you can see\b/gi, type: "filler", label: "Filler phrase" },
  { re: /\bin order to\b/gi, type: "verbosity", label: "Wordy connective" },
  { re: /\bdue to the fact that\b/gi, type: "verbosity", label: "Wordy connective" },
  { re: /\bat this point in time\b/gi, type: "verbosity", label: "Wordy connective" },
  { re: /\bthe following\b/gi, type: "verbosity", label: "Wordy connective" },
  { re: /\bas follows\b/gi, type: "verbosity", label: "Wordy connective" },
  { re: /\b(kindly|please)\b/gi, type: "politeness", label: "Politeness token" },
  { re: /\b(just|simply|really|very|actually|basically|essentially)\b/gi, type: "filler", label: "Weak intensifier" },
];
const VAGUE_TERMS = ["good","nice","better","some","stuff","things","a lot","etc","and so on","appropriate","as needed","high quality"];
const SENT_OPEN = String.fromCharCode(0xe000);
const SENT_CLOSE = String.fromCharCode(0xe001);
function maskProtected(text: string): { masked: string; restore: (s: string) => string } {
  const store: string[] = [];
  let masked = text.replace(/```[\s\S]*?```/g, (m) => { store.push(m); return SENT_OPEN + (store.length - 1) + SENT_CLOSE; });
  masked = masked.replace(/"[^"]{40,}"/g, (m) => { store.push(m); return SENT_OPEN + (store.length - 1) + SENT_CLOSE; });
  const restore = (s: string) => s.replace(new RegExp(SENT_OPEN + "(\\d+)" + SENT_CLOSE, "g"), (_, i) => store[Number(i)] ?? "");
  return { masked, restore };
}
function dedupeSentences(text: string): { out: string; removed: number } {
  const parts = text.split(/(?<=[.!?])\s+/);
  const seen = new Set<string>(); const kept: string[] = []; let removed = 0;
  for (const p of parts) {
    const norm = p.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
    if (norm.length > 12 && seen.has(norm)) { removed += estimateTokens(p); continue; }
    if (norm.length > 12) seen.add(norm);
    kept.push(p);
  }
  return { out: kept.join(" "), removed };
}
export function optimize(input: string, opts: OptimizeOptions = {}): OptimizeResult {
  const modelId = opts.modelId ?? "gpt-4o";
  const level = opts.level ?? "balanced";
  const model = getModel(modelId) ?? getModel("gpt-4o")!;
  const kind = detectKind(input);
  const originalTokens = estimateTokens(input, kind);
  const waste: WasteItem[] = [];
  const { masked, restore } = maskProtected(input);
  let working = masked;
  const groupTokens: Record<string, number> = {};
  const groupLabels: Record<string, Set<string>> = {};
  for (const { re, type, label } of FILLER_PATTERNS) {
    working = working.replace(re, (m) => {
      groupTokens[type] = (groupTokens[type] ?? 0) + estimateTokens(m);
      (groupLabels[type] ??= new Set()).add(label);
      return " ";
    });
  }
  for (const type of Object.keys(groupTokens)) {
    if (groupTokens[type] > 0) {
      waste.push({
        type: type as WasteItem["type"],
        label: type === "politeness" ? "Removed politeness padding" : type === "verbosity" ? "Tightened wordy phrasing" : "Dropped emphatic filler",
        detail: Array.from(groupLabels[type]).join(", "),
        tokensSaved: groupTokens[type],
      });
    }
  }
  if (level === "aggressive" || level === "reduce") {
    const before = working;
    working = working.replace(/\b(for example|for instance|e\.g\.)[^.?!]*[.?!]/gi, "");
    const saved = estimateTokens(before) - estimateTokens(working);
    if (saved > 0) waste.push({ type: "examples", label: "Removed inline examples", detail: "Cut for-example asides (aggressive mode)", tokensSaved: saved });
  }
  if (level === "reduce") {
    // maximum token reduction: strip hedging / modal padding that adds no instruction
    const before = working;
    working = working.replace(/\b(could you|would you|when you (get|have) (a chance|time)|if possible|i think|i believe|kind of|sort of|a bit|a little|somewhat|perhaps|maybe)\b/gi, " ");
    const saved = estimateTokens(before) - estimateTokens(working);
    if (saved > 0) waste.push({ type: "verbosity", label: "Reduced hedging & modals", detail: "Removed soft/uncertain phrasing for maximum token reduction", tokensSaved: saved });
  }
  const dd = dedupeSentences(working);
  working = dd.out;
  if (dd.removed > 0) waste.push({ type: "redundancy", label: "Removed repeated text", detail: "Collapsed sentences that restated the same instruction", tokensSaved: dd.removed });
  const beforeWs = working;
  working = working.replace(/[ \t]{2,}/g, " ").replace(/\s+([,.!?:;])/g, "$1").replace(/([,.!?:;]){2,}/g, "$1").replace(/\n{3,}/g, "\n\n").replace(/ +\n/g, "\n").replace(/(^|[.!?]\s+)[,;:]\s*/g, "$1").replace(/^[\s,;:]+/, "").replace(/[\s,;:]+$/, "").trim();
  const wsSaved = estimateTokens(beforeWs) - estimateTokens(working);
  if (wsSaved > 0) waste.push({ type: "whitespace", label: "Normalized spacing", detail: "Collapsed extra spaces, blank lines, and stray punctuation", tokensSaved: wsSaved });
  working = working.replace(/(^|[.!?]\s+)([a-z])/g, (_m, pre, ch) => pre + ch.toUpperCase());
  if (level === "clarity") {
    // readability touch-ups: fix lone "i", ensure terminal punctuation
    working = working.replace(/\bi\b/g, "I");
    if (working && !/[.!?]$/.test(working.trim())) working = working.trim() + ".";
  }
  const optimized = restore(working);
  const optimizedTokens = estimateTokens(optimized, kind);
  const tokensSaved = Math.max(0, originalTokens - optimizedTokens);
  const compressionPct = originalTokens ? Math.round((tokensSaved / originalTokens) * 100) : 0;
  const clarityFlags = detectVagueness(input);
  const removedExamples = waste.some((w) => w.type === "examples");
  let risk = compressionPct * 0.6;
  if (removedExamples) risk += 18;
  if (compressionPct > 55) risk += 12;
  const safeShare = waste.filter((w) => w.type === "politeness" || w.type === "whitespace").reduce((s, w) => s + w.tokensSaved, 0) / Math.max(1, tokensSaved);
  risk -= safeShare * 18;
  const qualityRisk = Math.max(0, Math.min(100, Math.round(risk)));
  const qualityRiskLabel = qualityRisk < 25 ? "Low" : qualityRisk < 55 ? "Moderate" : "Elevated";
  const expectedOutput = opts.expectedOutputTokens ?? Math.min(1500, Math.round(optimizedTokens * 0.4) || 200);
  const savedPerCall = (tokensSaved / 1e6) * model.inputPerM;
  const monthlyRuns = opts.monthlyRuns ?? 0;
  const savedPerMonth = savedPerCall * monthlyRuns;
  const savedPerYear = savedPerMonth * 12;
  const routing = routeTask(input.slice(0, 600), optimizedTokens, expectedOutput);
  const readability = readabilityScore(optimized);
  const qualityConfidence = 100 - qualityRisk;
  return { original: input, optimized, kind, originalTokens, optimizedTokens, tokensSaved, compressionPct, qualityRisk, qualityRiskLabel, waste: waste.sort((a, b) => b.tokensSaved - a.tokensSaved), clarityFlags, savedPerCall, savedPerMonth, savedPerYear, routing, readability, qualityConfidence };
}
export function detectVagueness(text: string): ClarityFlag[] {
  const flags: ClarityFlag[] = [];
  const lower = text.toLowerCase();
  const found = VAGUE_TERMS.filter((v) => new RegExp(`\\b${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(lower));
  if (found.length) flags.push({ label: `Vague wording: ${found.slice(0, 4).join(", ")}`, suggestion: "Replace with concrete, measurable terms (e.g. concise to under 100 words)." });
  if (!/(format|json|markdown|bullet|table|step|word|sentence|paragraph|tone)/i.test(text)) flags.push({ label: "No output format specified", suggestion: "State the desired format/length so the model does not over-generate." });
  if (text.trim().split(/\s+/).length < 4) flags.push({ label: "Very short prompt", suggestion: "Add the goal and any constraints; underspecified prompts often need expensive re-tries." });
  return flags;
}
export function priceDelta(modelId: string, deltaTokens: number): number {
  const m = getModel(modelId) ?? getModel("gpt-4o")!;
  return callCost(m, deltaTokens, 0);
}

export interface CostRow {
  model: ModelSpec;
  inputTokens: number;
  /** USD to send this text as input only */
  inputCost: number;
  /** USD including an assumed output */
  totalCost: number;
}

/** "Estimate Token Cost": price the given text as input across every model, cheapest first. */
export function costBreakdown(text: string, expectedOutputTokens = 0): { tokens: number; rows: CostRow[] } {
  const tokens = estimateTokens(text);
  const rows = MODELS.map((m) => ({
    model: m,
    inputTokens: tokens,
    inputCost: callCost(m, tokens, 0),
    totalCost: callCost(m, tokens, expectedOutputTokens),
  })).sort((a, b) => a.totalCost - b.totalCost);
  return { tokens, rows };
}

/** "Rewrite Clearer": readability-first pass (keeps structure, fixes grammar/clarity). */
export function rewriteClearer(text: string, modelId = "gpt-4o"): OptimizeResult {
  return optimize(text, { modelId, level: "clarity" });
}

/** "Reduce Tokens": maximum reduction (aggressive + hedge/modal removal). */
export function reduceTokens(text: string, modelId = "gpt-4o"): OptimizeResult {
  return optimize(text, { modelId, level: "reduce" });
}

/** Approximate reading-ease (0-100, higher = easier). Deterministic, no syllable dict. */
export function readabilityScore(text: string): number {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return 0;
  const sentences = Math.max(1, (t.match(/[.!?]+/g) || []).length);
  const words = t.split(/\s+/).filter(Boolean);
  if (!words.length) return 0;
  const wordsPerSentence = words.length / sentences;
  const charsPerWord = words.reduce((s, w) => s + w.length, 0) / words.length;
  // shorter sentences & words => higher score
  const score = 100 - (wordsPerSentence - 12) * 2.2 - (charsPerWord - 4.7) * 9;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export type DetectedContext = "code" | "json" | "markdown" | "email" | "notes" | "prompt" | "document";
export interface ContextInfo {
  context: DetectedContext;
  /** the optimization level that suits this context */
  suggestedLevel: "balanced" | "aggressive" | "clarity" | "reduce";
  /** short human label for the UI, e.g. "Email -> Rewrite" */
  label: string;
}

/**
 * Smart-mode detection: classify selected text and suggest the right optimization.
 * Code/JSON/Markdown are preserved (the engine already protects fenced/quoted spans).
 */
export function detectContext(text: string): ContextInfo {
  const t = text.trim();
  const k = detectKind(t);
  if (k === "json") return { context: "json", suggestedLevel: "balanced", label: "JSON \u2192 preserve structure" };
  if (k === "code") return { context: "code", suggestedLevel: "balanced", label: "Code \u2192 preserve syntax" };
  // meeting notes are keyword-driven so generic markdown lists don't steal them
  if (/\b(action items?|attendees?|agenda|minutes|next steps|decisions?|follow[- ]?ups?)\b/i.test(t))
    return { context: "notes", suggestedLevel: "aggressive", label: "Notes \u2192 summarize" };
  if (/\n/.test(t) && /(\bdear\b|\bhi\b|\bhello\b|\bhey\b|\bregards\b|\bsincerely\b|\bbest,|sent from my|subject:)/i.test(t))
    return { context: "email", suggestedLevel: "clarity", label: "Email \u2192 rewrite professionally" };
  if (/^#{1,6}\s|\n[-*+]\s|\n\d+\.\s|```|\[[^\]]+\]\([^)]+\)/.test(t))
    return { context: "markdown", suggestedLevel: "balanced", label: "Markdown \u2192 preserve formatting" };
  if (/\b(you are|act as|respond with|return only|summarize|rewrite|generate|classify|output (a|the|only)|step by step|system prompt)\b/i.test(t))
    return { context: "prompt", suggestedLevel: "balanced", label: "Prompt \u2192 reduce tokens" };
  return { context: "document", suggestedLevel: "aggressive", label: "Document \u2192 compress intelligently" };
}

/** Run optimize using the auto-detected context's suggested level. */
export function optimizeAuto(text: string, modelId = "gpt-4o", monthlyRuns = 0): OptimizeResult & { detected: ContextInfo } {
  const detected = detectContext(text);
  const result = optimize(text, { modelId, monthlyRuns, level: detected.suggestedLevel });
  return { ...result, detected };
}
