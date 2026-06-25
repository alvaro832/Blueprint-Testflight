import { describe, it, expect } from "vitest";
import { estimateTokens, detectKind } from "./tokens";
import { routeTask, callCost, getModel } from "./pricing";
import { optimize, detectVagueness, costBreakdown, rewriteClearer, reduceTokens, detectContext, optimizeAuto, readabilityScore } from "./optimizer";

const VERBOSE =
  "I would like you to please carefully read through the following customer support email that we have received from one of our valued customers, and then I want you to write a response. Please make sure that the response is polite and professional in tone. It is very important that you address all of their concerns. Please do not forget to thank them. Thank you so much for your help!";

describe("tokens", () => {
  it("returns 0 for empty input", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("   ")).toBe(0);
  });
  it("scales with length", () => {
    expect(estimateTokens("hello world")).toBeLessThan(estimateTokens("hello world ".repeat(20)));
  });
  it("detects content kinds", () => {
    expect(detectKind('{"a":1,"b":[1,2,3]}')).toBe("json");
    expect(detectKind("the quick brown fox jumps over")).toBe("prose");
  });
});

describe("pricing & routing", () => {
  it("prices a call correctly", () => {
    expect(callCost(getModel("gpt-4o")!, 1_000_000, 1_000_000)).toBeCloseTo(12.5, 5);
  });
  it("routes easy classification to a cheap hosted model", () => {
    const r = routeTask("classify a support ticket into one of four labels, return only the label", 600, 15);
    expect(r.requiredTier).toBeLessThanOrEqual(2);
    expect(r.recommended).toBeDefined();
    expect(r.recommended!.vendor).not.toBe("Local");
  });
  it("routes hard contract analysis to a high tier", () => {
    const r = routeTask("analyze a legal contract for liability and negotiate strategy with detailed reasoning", 45000, 2500);
    expect(r.requiredTier).toBeGreaterThanOrEqual(3);
  });
  it("ranks models cheapest-first", () => {
    const r = routeTask("summarize", 1000, 200);
    for (let i = 1; i < r.ranked.length; i++) expect(r.ranked[i].cost).toBeGreaterThanOrEqual(r.ranked[i - 1].cost);
  });
});

describe("optimizer", () => {
  const res = optimize(VERBOSE, { modelId: "gpt-4o", monthlyRuns: 50000 });

  it("reduces tokens by >20%", () => {
    expect(res.optimizedTokens).toBeLessThan(res.originalTokens);
    expect(res.compressionPct).toBeGreaterThan(20);
  });
  it("reports removed waste incl. politeness", () => {
    expect(res.waste.length).toBeGreaterThan(0);
    expect(res.waste.some((w) => w.type === "politeness")).toBe(true);
  });
  it("computes consistent savings", () => {
    expect(res.savedPerCall).toBeGreaterThan(0);
    expect(res.savedPerMonth).toBeCloseTo(res.savedPerCall * 50000, 6);
    expect(res.savedPerYear).toBeCloseTo(res.savedPerMonth * 12, 6);
  });
  it("keeps quality risk in 0-100", () => {
    expect(res.qualityRisk).toBeGreaterThanOrEqual(0);
    expect(res.qualityRisk).toBeLessThanOrEqual(100);
  });
  it("never throws on empty / odd input", () => {
    expect(() => optimize("")).not.toThrow();
    expect(optimize("").compressionPct).toBe(0);
    expect(() => optimize("```code only```")).not.toThrow();
  });
  it("preserves fenced code blocks verbatim", () => {
    const r = optimize("Please just fix this:\n```js\nconst x = 1; // please keep\n```");
    expect(r.optimized).toContain("const x = 1; // please keep");
  });
  it("flags vague prompts", () => {
    expect(detectVagueness("make it good and nice").some((f) => /vague/i.test(f.label))).toBe(true);
  });
});

describe("cost & clarity", () => {
  it("costBreakdown ranks models cheapest-first and prices input", () => {
    const { tokens, rows } = costBreakdown("hello ".repeat(500), 200);
    expect(tokens).toBeGreaterThan(0);
    for (let i = 1; i < rows.length; i++) expect(rows[i].totalCost).toBeGreaterThanOrEqual(rows[i - 1].totalCost);
    const gpt4o = rows.find((r) => r.model.id === "gpt-4o")!;
    expect(gpt4o.inputCost).toBeCloseTo((tokens / 1e6) * 2.5, 6);
  });
  it("rewriteClearer fixes lone 'i' and ensures terminal punctuation", () => {
    const r = rewriteClearer("please make this clear i want it readable");
    expect(/\bI\b/.test(r.optimized)).toBe(true);
    expect(/[.!?]$/.test(r.optimized.trim())).toBe(true);
  });
  it("clarity mode never throws on empty", () => {
    expect(() => rewriteClearer("")).not.toThrow();
  });
});

describe("reduce tokens", () => {
  const HEDGE = "Could you maybe, when you get a chance, kind of help me rewrite this? I think it would be nice if you could perhaps make it a bit shorter, for example by trimming it. Thank you so much for your help!";
  it("reduces at least as much as aggressive on hedge-heavy text", () => {
    const agg = optimize(HEDGE, { level: "aggressive" });
    const red = reduceTokens(HEDGE);
    expect(red.compressionPct).toBeGreaterThanOrEqual(agg.compressionPct);
  });
  it("still preserves fenced code", () => {
    const r = optimize("Could you just fix:\n```js\nconst x = 1; // keep\n```", { level: "reduce" });
    expect(r.optimized).toContain("const x = 1; // keep");
  });
});

describe("smart context + metrics", () => {
  it("adds readability and qualityConfidence to results", () => {
    const r = optimize("Please could you summarize this. Thank you so much!");
    expect(r.readability).toBeGreaterThanOrEqual(0);
    expect(r.readability).toBeLessThanOrEqual(100);
    expect(r.qualityConfidence).toBe(100 - r.qualityRisk);
  });
  it("readabilityScore: short sentences score higher than long ones", () => {
    const short = readabilityScore("Go now. Stop. Run fast.");
    const long = readabilityScore("Notwithstanding the aforementioned considerations, the comprehensive evaluation necessitated extraordinarily protracted deliberation.");
    expect(short).toBeGreaterThan(long);
  });
  it("detects JSON, code, email, notes, prompt", () => {
    expect(detectContext('{"a":1,"b":[1,2]}').context).toBe("json");
    expect(detectContext("function add(a,b){ return a+b; } const x = add(1,2);").context).toBe("code");
    expect(detectContext("Hi team,\nPlease review.\nRegards,\nSam").context).toBe("email");
    expect(detectContext("Agenda\n- item one\n- item two\nAction items: ship it").context).toBe("notes");
    expect(detectContext("You are a helpful assistant. Return only JSON.").context).toBe("prompt");
  });
  it("optimizeAuto returns a detected context and a result", () => {
    const r = optimizeAuto("Hi team,\nCould you please review this. Thanks!");
    expect(r.detected).toBeDefined();
    expect(typeof r.optimized).toBe("string");
  });
});
