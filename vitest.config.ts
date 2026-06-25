[package]
name = "blueprint-token-optimizer"
version = "1.0.0"
description = "Blueprint Token Optimizer — reduce AI token usage before prompts reach any model."
authors = ["Blueprint"]
edition = "2021"
rust-version = "1.77"

[lib]
name = "blueprint_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-global-shortcut = "2"
tauri-plugin-clipboard-manager = "2"
tauri-plugin-autostart = "2"
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rusqlite = { version = "0.31", features = ["bundled"] }
keyring = "2"
enigo = "0.2"
dirs = "5"

[features]
# this feature is used for production builds where `devUrl` is not needed
custom-protocol = ["tauri/custom-protocol"]
