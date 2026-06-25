// Optimizes the file passed as argv[2] and writes <name>.optimized.<ext> next to it.
// Wired to a VS Code task (see tasks.json): run "Blueprint: Optimize current file".
import { optimize } from "../blueprint.mjs";
import { readFileSync, writeFileSync } from "node:fs";

const path = process.argv[2];
if (!path) { console.error("usage: node optimize-file.mjs <file>"); process.exit(1); }
const text = readFileSync(path, "utf8");
const level = process.argv[3] || "balanced";
const r = optimize(text, { level });
const out = path.replace(/(\.[^.]+)?$/, ".optimized$1");
writeFileSync(out, r.optimized);
console.log(`Blueprint: ${r.originalTokens} → ${r.optimizedTokens} tokens (-${r.compressionPct}%). Wrote ${out}`);
