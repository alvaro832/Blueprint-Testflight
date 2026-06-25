# Blueprint Engine — drop-in AI prompt optimizer

Zero dependencies. No build step. Reduce / compress / clarify prompts and estimate token
cost **before** you send them to any model. This is the same optimization engine that powers
the Blueprint desktop app, packaged so you can plug it into your IDE or codebase **right now**.

Works in Node 16+, Deno, Bun, browsers, and from the command line.

## 1. Use it in code (ESM / TypeScript)

```js
import { optimize, reduceTokens, costBreakdown } from "./blueprint.mjs";

const r = optimize(userPrompt, { modelId: "gpt-4o", level: "balanced", monthlyRuns: 10000 });
r.optimized;        // the leaner prompt — send THIS to your model
r.originalTokens;   // e.g. 95
r.optimizedTokens;  // e.g. 34
r.compressionPct;   // 64
r.savedPerCall;     // $ saved per call (input side)
r.qualityRisk;      // 0–100 (how much meaning may have shifted)
r.waste;            // [{ label, detail, tokensSaved }] — what was removed
r.routing.recommended; // cheapest model that can still do the task
```

`level` options: `"balanced"` (default), `"aggressive"` (compress context),
`"reduce"` (maximum token reduction), `"clarity"` (readability rewrite).

## 2. Use it in CommonJS

```js
const { optimize } = require("./blueprint.cjs");
console.log(optimize("Please could you summarize this. Thank you!").optimized);
```

## 3. Use it from the command line

```bash
echo "your verbose prompt" | node cli.mjs --level reduce
node cli.mjs "Please carefully summarize this. Thanks!" --runs 10000
node cli.mjs --file prompt.md --json
cat prompt.txt | node cli.mjs --cost        # token-cost table across models
```

Install globally to get a `blueprint` command:

```bash
npm i -g .        # from this folder
blueprint "optimize me" --level reduce --quiet
```

`--quiet` prints only the optimized text — perfect for piping into other tools.

## 4. Auto-optimize before every API call (pre-send wrapper)

Wrap your SDK so the last user message is optimized automatically — you instantly pay for
fewer input tokens. See `examples/openai-wrapper.mjs` and `examples/anthropic-wrapper.mjs`:

```js
import { optimizedChat } from "./examples/openai-wrapper.mjs";
const res = await optimizedChat([{ role: "user", content: bigPrompt }], { model: "gpt-4o" });
```

## 5. Use it in a browser / DevTools

```html
<script src="blueprint.global.js"></script>
<script>
  const r = Blueprint.optimize(document.querySelector("textarea").value, { level: "reduce" });
  console.log(r.optimized, r.compressionPct + "% smaller");
</script>
```

## 6. Use it inside VS Code

Copy the `.vscode/` folder into your project. Then **Terminal → Run Task →
"Blueprint: Optimize current file"** writes a `*.optimized` copy next to the open file
(there's also a "Reduce tokens (max)" task).

## API

| Function | Returns |
|---|---|
| `optimize(text, { modelId?, level?, monthlyRuns?, expectedOutputTokens? })` | full `OptimizeResult` |
| `reduceTokens(text, modelId?)` | `OptimizeResult` (max reduction) |
| `rewriteClearer(text, modelId?)` | `OptimizeResult` (clarity pass) |
| `costBreakdown(text, expectedOutputTokens?)` | `{ tokens, rows[] }` priced per model |
| `routeTask(desc, inputTokens, outputTokens)` | difficulty score + cheapest capable model |
| `estimateTokens(text)` | number |
| `MODELS`, `TIER_LABEL`, `callCost`, `getModel`, `detectKind`, `detectVagueness` | helpers |

## Notes

- **100% local & private.** Nothing is sent anywhere; the engine is pure string processing.
- **Safe by design.** Fenced ```code``` blocks and long "quoted" spans are never rewritten.
- Token counts are a fast offline estimate (~4 chars/token blend); model prices are
  representative public list prices — edit them in the `MODELS` array if yours differ.

MIT licensed. Bundled as a starter you can rebrand or extend.
