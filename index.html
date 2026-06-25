//! Capture and replace the user's current text selection in ANY desktop app, by simulating
//! the OS copy/paste shortcuts. This is what powers the global-hotkey "Grammarly" flow.

use enigo::{Direction, Enigo, Key, Keyboard, Settings};
use std::{thread, time::Duration};
use tauri_plugin_clipboard_manager::ClipboardExt;

#[cfg(target_os = "macos")]
const MOD: Key = Key::Meta;
#[cfg(not(target_os = "macos"))]
const MOD: Key = Key::Control;

fn tap(enigo: &mut Enigo, letter: char) {
    let _ = enigo.key(MOD, Direction::Press);
    let _ = enigo.key(Key::Unicode(letter), Direction::Click);
    let _ = enigo.key(MOD, Direction::Release);
}

/// Send Copy to the foreground app, then read the clipboard.
pub fn capture<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> Result<String, String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    thread::sleep(Duration::from_millis(120));
    tap(&mut enigo, 'c');
    thread::sleep(Duration::from_millis(150));
    app.clipboard().read_text().map_err(|e| e.to_string())
}

/// Put `text` on the clipboard, then send Paste to the foreground app.
pub fn replace<R: tauri::Runtime>(app: &tauri::AppHandle<R>, text: &str) -> Result<(), String> {
    app.clipboard().write_text(text.to_string()).map_err(|e| e.to_string())?;
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    thread::sleep(Duration::from_millis(120));
    tap(&mut enigo, 'v');
    Ok(())
}
