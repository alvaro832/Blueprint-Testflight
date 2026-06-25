# Installing Blueprint Token Optimizer

Two ways to install: **(A)** download a prebuilt installer, or **(B)** build from source.

## A. Prebuilt installers (end users)

After building (see BUILD.md) or downloading a release, install the file for your OS:

| OS | File | How |
|----|------|-----|
| **Windows** | `Blueprint Token Optimizer_1.0.0_x64-setup.exe` (NSIS) or `..._x64_en-US.msi` | Double-click → follow the wizard. |
| **macOS** | `Blueprint Token Optimizer_1.0.0_aarch64.dmg` (or `_x64`) | Open the `.dmg`, drag the app to **Applications**. |
| **Linux** | `blueprint-token-optimizer_1.0.0_amd64.AppImage` | `chmod +x *.AppImage && ./*.AppImage`. Or install the `.deb` / `.rpm`. |

### First-run permissions
- **macOS:** the global hotkey and "Replace selection" need **Accessibility** access.
  Go to *System Settings → Privacy & Security → Accessibility* and enable Blueprint.
  Unsigned builds: right-click the app → **Open** the first time (or
  `xattr -dr com.apple.quarantine "/Applications/Blueprint Token Optimizer.app"`).
- **Windows:** SmartScreen may warn on unsigned builds → *More info → Run anyway*.
- **Linux:** the keychain uses the Secret Service (GNOME Keyring / KWallet). On headless
  systems install `gnome-keyring`. AppImage may need `libfuse2`.

## B. Build from source (developers)

Prerequisites: **Node 18+**, **Rust (stable)**, and the Tauri system deps for your OS
(see BUILD.md). Then:

```bash
git clone <your-repo> blueprint-token-optimizer
cd blueprint-token-optimizer
npm install
npm run tauri:dev        # dev run
npm run tauri:build      # produce installers
```

Installers are written to `src-tauri/target/release/bundle/`.
