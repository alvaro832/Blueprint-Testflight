# Bug-Prevention Checklist

Design choices that keep Blueprint stable and safe to ship.

## Engine correctness
- **Pure functions only.** The optimizer/tokens/pricing modules have no DOM or network deps, so
  they are deterministic and fully unit-testable (`optimizer.test.ts`).
- **Protected spans.** Code fences and long quoted text are masked with Private-Use-Area
  sentinels before transformation and restored after — user content is never rewritten.
- **Clamping.** Token counts are `≥ 0`; quality risk and difficulty are clamped to fixed ranges;
  divisions guard against divide-by-zero.
- **Conservative defaults.** "Balanced" mode never strips examples; aggressive trimming is opt-in
  and raises the displayed quality-risk score.

## Robust I/O
- **Crash-safe saves.** History writes go to SQLite (WAL mode) immediately after each optimize;
  a failed write is caught and never blocks the UI.
- **Graceful degradation.** Every native call in `bridge.ts` has a browser fallback, so the app
  works in `npm run dev`, the web preview, and the packaged build.
- **API resilience.** The optional live-API layer has a 20s timeout, one retry, typed errors
  (`auth/timeout/network/server/offline`), and an offline guard.
- **Input validation.** Numeric fields reject negatives; file upload checks size and read
  errors; empty optimize input is blocked with a message.

## UI safety
- **Loading / empty / error states** on every async action and data screen.
- **No unhandled promise rejections.** Async handlers wrap work in try/catch and surface a
  user-facing message instead of throwing.
- **No layout thrash.** The optimize call yields to the event loop so the spinner renders even
  for very large inputs.

## Security
- **Keys in OS keychain**, never localStorage in the packaged app, never logged, never returned
  to the UI (only a boolean "present" flag is exposed).
- **Least-privilege capabilities.** `capabilities/default.json` grants only the window/clipboard/
  shortcut/fs/dialog permissions actually used.
- **Tight CSP.** `connect-src` is limited to the supported provider domains + localhost.
- **One-click data wipe.** Users can delete all local data; deletes are idempotent (missing
  keychain entries are treated as success).

## Build hygiene
- `tsc` runs before every production build (`npm run build`).
- `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` enabled.
- Release Windows builds use `windows_subsystem = "windows"` to suppress the console window.
- Pin plugin versions in `Cargo.toml` / `package.json`; run `cargo clippy` and `npm audit` in CI.
