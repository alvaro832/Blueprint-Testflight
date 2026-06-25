# Troubleshooting

### The global hotkey (Ctrl/Cmd+Shift+B) does nothing
- **macOS:** enable Blueprint under *System Settings → Privacy & Security → Accessibility*.
  Without it, the OS blocks key simulation and selection capture.
- Another app may already own that shortcut. Change it in `src-tauri/src/lib.rs`
  (`Shortcut::new(...)`) and rebuild.
- Make sure Blueprint is running (look for the tray icon).

### "Replace selection" pastes nothing / pastes into the wrong place
- The target app must keep focus. Blueprint copies the result to the clipboard then sends the
  paste shortcut to whatever app is frontmost. Click into the target field first.
- **Linux:** install `libxdo-dev` (build) / `xdotool` runtime, and ensure you are on X11 or a
  Wayland session with input emulation allowed.

### Selection capture returns empty text
- Highlight the text first, then press the hotkey. Blueprint sends Copy and reads the clipboard;
  if nothing is selected, it returns empty (by design).

### API key won't save / "keychain" errors
- **Linux:** install and unlock a Secret Service provider (`gnome-keyring` or KWallet). Headless
  servers have no keychain — run on a desktop session.
- Keys are optional. The optimizer works fully without any key.

### `npm run tauri:build` fails
- Re-check the system dependencies in **BUILD.md** for your OS (WebView2, build tools,
  webkit2gtk, libsecret, etc.).
- Delete `node_modules` and `src-tauri/target`, then `npm install` and rebuild.
- Ensure Rust is stable and up to date: `rustup update`.

### Windows SmartScreen / macOS "app is damaged or can't be opened"
- These appear for **unsigned** builds. Windows: *More info → Run anyway*. macOS: right-click →
  *Open*, or `xattr -dr com.apple.quarantine "<app>"`. For distribution, code-sign and notarize.

### The app window is blank
- Run `npm run dev` separately and open http://localhost:1420 to see frontend errors.
- Check the dev console (right-click → Inspect in the Tauri window during `tauri:dev`).

### Numbers look approximate
- Token counts use a fast offline estimate (~4 chars/token blend) and **representative** public
  list prices. Update prices in `src/lib/pricing.ts`, or connect a provider for exact counts.

### Reset everything
- *Settings → Delete all my data* clears history and removes stored keys. To fully reset, also
  delete the app-data folder (`blueprint.sqlite`) shown for your OS by Tauri's `app_data_dir`.
