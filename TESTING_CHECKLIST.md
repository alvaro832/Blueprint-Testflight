//! Blueprint Token Optimizer — Tauri (Rust) backend.
//! Tray app + global hotkey + frameless floating window + local SQLite + OS-keychain keys.

mod db;
mod keys;
mod selection;

use db::{Db, HistoryRow};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Manager, WebviewWindow,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_autostart::MacosLauncher;

const PROVIDERS: [&str; 9] = [
    "openai", "anthropic", "google", "xai", "deepseek", "mistral", "meta", "local", "custom",
];

/* ----------------------------- key commands ----------------------------- */
#[tauri::command]
fn save_api_key(provider: String, key: String) -> Result<(), String> {
    keys::save(&provider, &key)
}
#[tauri::command]
fn read_api_key(provider: String) -> Option<String> {
    keys::read(&provider)
}
#[tauri::command]
fn has_api_key(provider: String) -> bool {
    keys::has(&provider)
}
#[tauri::command]
fn delete_api_key(provider: String) -> Result<(), String> {
    keys::delete(&provider)
}

/* ----------------------------- history commands ------------------------- */
#[tauri::command]
fn add_history(state: tauri::State<Db>, row: HistoryRow) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::insert(&conn, &row).map_err(|e| e.to_string())
}
#[tauri::command]
fn list_history(state: tauri::State<Db>) -> Result<Vec<HistoryRow>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::list(&conn).map_err(|e| e.to_string())
}
#[tauri::command]
fn clear_history(state: tauri::State<Db>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::clear(&conn).map_err(|e| e.to_string())
}
#[tauri::command]
fn wipe_all_data(state: tauri::State<Db>) -> Result<(), String> {
    {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        db::clear(&conn).map_err(|e| e.to_string())?;
    }
    keys::delete_all(&PROVIDERS);
    Ok(())
}

/* ----------------------------- selection commands ----------------------- */
#[tauri::command]
fn capture_selection(app: tauri::AppHandle) -> Result<String, String> {
    selection::capture(&app)
}
#[tauri::command]
fn replace_selection(app: tauri::AppHandle, text: String) -> Result<(), String> {
    selection::replace(&app, &text)
}
#[tauri::command]
fn hide_floating(app: tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("floating") {
        let _ = w.hide();
    }
}

/// Re-register the global hotkey from a settings accelerator (e.g. "CmdOrCtrl+Shift+B").
#[tauri::command]
fn update_shortcut(app: tauri::AppHandle, accelerator: String) -> bool {
    let gs = app.global_shortcut();
    let _ = gs.unregister_all();
    gs.register(accelerator.as_str()).is_ok()
}

fn show_floating(window: &WebviewWindow) {
    let _ = window.show();
    let _ = window.set_focus();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let hotkey = Shortcut::new(Some(Modifiers::SHIFT | Modifiers::CONTROL | Modifiers::META), Code::KeyB);

    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        if let Some(w) = app.get_webview_window("floating") {
                            // toggle: hide if visible, else capture+show
                            if w.is_visible().unwrap_or(false) {
                                let _ = w.hide();
                            } else {
                                show_floating(&w);
                                let _ = app.emit("floating-opened", ());
                            }
                        }
                    }
                })
                .build(),
        )
        .setup(move |app| {
            // --- database in app data dir ---
            let dir = app.path().app_data_dir().expect("app data dir");
            std::fs::create_dir_all(&dir).ok();
            let conn = db::open(&dir.join("blueprint.sqlite"));
            app.manage(Db(std::sync::Mutex::new(conn)));

            // --- register the global hotkey ---
            app.global_shortcut().register(hotkey)?;

            // --- system tray ---
            let open = MenuItem::with_id(app, "open", "Open Blueprint", true, None::<&str>)?;
            let optimize = MenuItem::with_id(app, "optimize", "Optimize selection", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &optimize, &quit])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("Blueprint Token Optimizer")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "optimize" => {
                        if let Some(w) = app.get_webview_window("floating") {
                            show_floating(&w);
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_api_key, read_api_key, has_api_key, delete_api_key,
            add_history, list_history, clear_history, wipe_all_data,
            capture_selection, replace_selection, hide_floating, update_shortcut
        ])
        .run(tauri::generate_context!())
        .expect("error while running Blueprint Token Optimizer");
}
