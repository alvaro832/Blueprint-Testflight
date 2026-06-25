# Testing Checklist

## Automated
- [ ] `npm test` passes (engine, pricing, routing unit tests in `src/lib/optimizer.test.ts`).
- [ ] `npm run build` completes with no TypeScript errors.
- [ ] `cargo test` (if you add Rust tests) and `cargo clippy` are clean.

## Optimization engine
- [ ] Empty / whitespace-only input returns 0% compression and does not throw.
- [ ] A verbose prompt compresses 30–65% with readable output.
- [ ] Fenced ```code``` blocks and long "quoted" spans are preserved verbatim.
- [ ] Quality-risk score stays within 0–100 and rises with aggressive trimming.
- [ ] Savings = (orig − opt) tokens × input price; month = call × runs; year = month × 12.

## UI states (each screen)
- [ ] **Loading**: optimize/compress shows a spinner; never freezes the window.
- [ ] **Empty**: Dashboard/History/Export show friendly empty states before any data.
- [ ] **Error**: invalid input, unreadable file, and offline API calls show clear messages.
- [ ] **Validation**: runs/month and token inputs reject negatives; huge files warn (>2 MB).

## Native features (packaged build)
- [ ] Hotkey `Ctrl/Cmd+Shift+B` toggles the floating window.
- [ ] Floating window captures the current selection and optimizes it.
- [ ] **Copy** and **Replace selection** both work in a third-party app (e.g. Notes, browser).
- [ ] Tray menu: Open Blueprint / Optimize selection / Quit all work.
- [ ] History persists across app restarts (SQLite).
- [ ] API key saves to the OS keychain; "Connected" shows; Remove deletes it.
- [ ] *Delete all my data* clears history AND keys.

## Cross-platform
- [ ] Windows installer (NSIS + MSI) installs and launches.
- [ ] macOS `.dmg` installs; Accessibility prompt explained; hotkey works after granting.
- [ ] Linux AppImage runs; tray + keychain work on a desktop session.

## Privacy
- [ ] With no key connected, optimizing performs zero network requests (verify in a network monitor).
- [ ] Telemetry is OFF by default.
