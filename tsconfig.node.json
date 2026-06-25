# Building Blueprint Token Optimizer

## Prerequisites

1. **Node.js 18+** and npm — https://nodejs.org
2. **Rust (stable)** — https://rustup.rs  (`rustup default stable`)
3. **Tauri system dependencies** (one-time, per OS):

### Windows
- **Microsoft C++ Build Tools** (Desktop development with C++).
- **WebView2 runtime** (preinstalled on Windows 11; on Windows 10 install the Evergreen runtime).

### macOS
```bash
xcode-select --install
```

### Linux (Debian/Ubuntu)
```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev libsecret-1-dev
```
> `libxdo-dev` is required for selection capture/replace (enigo); `libsecret-1-dev` for the
> keychain; `libayatana-appindicator3-dev` for the tray icon.

## Install JS deps

```bash
npm install
```

## Generate icons (optional — a set is already included)

```bash
npm run tauri icon src-tauri/icons/icon.png
```

## Develop

```bash
npm run tauri:dev
```
Vite serves the UI on port 1420 and Tauri opens the native window with hot reload.

## Build installers

```bash
npm run tauri:build
```

Outputs (per OS) land in `src-tauri/target/release/bundle/`:
- Windows → `nsis/*.exe`, `msi/*.msi`
- macOS → `dmg/*.dmg`, `macos/*.app`
- Linux → `appimage/*.AppImage`, `deb/*.deb`, `rpm/*.rpm`

### Cross-platform note
Tauri builds for the OS you are on. To ship all three, run the build on each OS (or use CI such
as GitHub Actions with a matrix of `windows-latest`, `macos-latest`, `ubuntu-latest`).

### Web-only build (UI preview, no native features)
```bash
npm run build && npm run preview
```
This serves the React UI in a browser. The tray, hotkey, selection capture, and encrypted key
storage are native-only and are automatically stubbed in the browser.

## Type-check & tests
```bash
npm run build   # runs `tsc` then `vite build`
npm test        # vitest
```
