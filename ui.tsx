# Blueprint Token Optimizer

**Reduce AI token usage before your prompts ever reach a model.** Blueprint is a local-first
desktop app (Windows · macOS · Linux) that compresses prompts, documents, and workflows,
estimates your savings, scores quality risk, and recommends the cheapest capable model — for
Claude, OpenAI, Gemini, Grok, Llama, DeepSeek, Mistral, local models, or any custom endpoint.

> Think **Grammarly for AI token costs.** Highlight text in any app, press a hotkey, and get a
> shorter, cheaper, cleaner prompt instantly.

---

## Why it exists

LLM bills are mostly **wasted tokens** — politeness padding, repeated instructions, bloated
context, and over-powered models doing trivial work. Blueprint removes that waste *before* you
pay for it, with a transparent before/after report so you always know what changed and why.

## Core action

Everything supports one action: **Optimize Prompt.**

`Paste → Optimize → Copy.` That's it. You don't need to understand tokens, APIs, or routing.

## Features

- **Prompt Optimizer** — paste anything (prompt, email, JSON, code); get a leaner version plus
  original/optimized tokens, compression %, $ saved per call / month / year, quality-risk score,
  removed-waste breakdown, and clarity suggestions.
- **Document Compressor** — drop in a `.txt/.md/.json/.csv`/code file and compress long context
  (read locally, never uploaded).
- **Model Router** — scores a task's difficulty and ranks every model by cost, recommending the
  cheapest one that can still do the job.
- **History** — every optimization stored locally in SQLite; search and review.
- **Export** — download your records as CSV or JSON.
- **Settings** — connect provider API keys (encrypted in your OS keychain), set defaults, and
  control privacy.
- **Global hotkey + tray app (the main experience)** — Blueprint runs in the background; there is
  **no dashboard unless you open it** (click the tray icon). Highlight text in **any** desktop app
  — Claude, ChatGPT, Cursor, VS Code, browser, Notion, Google Docs, Slack, email — and press
  **`Ctrl/Cmd + Shift + B`**. A small floating optimizer appears instantly, auto-captures the
  selection, and offers six actions:

  1. **Optimize Prompt** — balanced token reduction
  2. **Compress Context** — aggressive compression for long context
  3. **Reduce Tokens** — maximum reduction (also strips hedging/modal padding)
  4. **Estimate Token Cost** — price the selection across every model, cheapest first
  5. **Rewrite Clearer** — readability/grammar pass that keeps your meaning
  6. **Copy Result** — copy the optimized text
  7. **Replace Selected Text** — paste the result back over your selection in-place

  It feels like **Grammarly for AI token savings**: instant, minimal, and universal.

## Tech stack

Tauri 2 · React 18 · TypeScript · Tailwind CSS · SQLite (rusqlite) · OS keychain (keyring).
Tauri produces small, fast, native binaries — far lighter than Electron.

## Privacy & security

- **Local-first.** The optimization engine runs 100% offline; your text is never uploaded.
- **No tracking, no account, no ads.** Telemetry is off and opt-in only.
- **Encrypted keys.** API keys live in the OS keychain (Windows Credential Manager, macOS
  Keychain, Linux Secret Service) — never in plaintext, never in logs.
- **You own your data.** One click in Settings deletes all history and keys.

## Quick start (run from source)

```bash
npm install
npm run tauri:dev      # launches the desktop app with hot reload
```

Build installers for your platform:

```bash
npm run tauri:build    # output in src-tauri/target/release/bundle/
```

See **docs/INSTALL.md** and **docs/BUILD.md** for full, per-platform instructions, and
**docs/TROUBLESHOOTING.md** if something doesn't work.

## Run the tests

```bash
npm test               # vitest — covers the optimization engine, pricing, and routing
```

## Project layout

```
blueprint-token-optimizer/
├── index.html                  # Vite entry
├── package.json
├── vite.config.ts / tsconfig*  # build config
├── tailwind.config.js
├── src/                        # React + TypeScript frontend
│   ├── main.tsx                # router: main app + #/floating window
│   ├── App.tsx                 # sidebar layout + routes
│   ├── lib/
│   │   ├── tokens.ts           # token estimation
│   │   ├── pricing.ts          # model catalog + cost + router
│   │   ├── optimizer.ts        # the offline compression engine
│   │   ├── optimizer.test.ts   # unit tests
│   │   ├── api.ts              # optional live-provider layer (timeouts/retries)
│   │   ├── bridge.ts           # native calls w/ browser fallbacks
│   │   ├── store.ts            # Zustand state
│   │   └── format.ts
│   ├── components/             # ui.tsx, ResultView.tsx
│   ├── screens/                # Dashboard, Optimize, Documents, History, Settings, ModelRouter, Export
│   └── floating/Floating.tsx   # hotkey floating window
└── src-tauri/                  # Rust backend
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── capabilities/default.json
    ├── icons/
    └── src/ (main.rs, lib.rs, db.rs, keys.rs, selection.rs)
```

## License

Provided as a complete starter you can ship, rebrand, or extend.
