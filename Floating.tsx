/**
 * Bridge between the React UI and the native (Rust/Tauri) layer.
 *
 * Everything degrades gracefully: when the app runs in a plain browser (e.g. `npm run dev`
 * without Tauri, or the web preview), native calls fall back to localStorage / clipboard API
 * so the UI stays fully functional. API keys are only *securely* stored in the native build
 * (OS keychain); the web fallback warns and uses localStorage.
 */

export interface HistoryRow {
  id: number;
  created_at: number;
  source: string; // "optimize" | "document" | "floating"
  model_id: string;
  original_tokens: number;
  optimized_tokens: number;
  saved_usd: number;
  quality_risk: number;
  preview: string;
}

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const core = await import("@tauri-apps/api/core");
  return core.invoke<T>(cmd, args);
}

/* ----------------------- API key storage (encrypted in native) ----------------------- */

export async function saveApiKey(provider: string, key: string): Promise<void> {
  if (isTauri()) return invoke("save_api_key", { provider, key });
  console.warn("[Blueprint] Web fallback: API key stored in localStorage (NOT encrypted).");
  localStorage.setItem("bp_key_" + provider, key);
}

export async function getApiKeyPresence(provider: string): Promise<boolean> {
  if (isTauri()) return invoke<boolean>("has_api_key", { provider });
  return !!localStorage.getItem("bp_key_" + provider);
}

export async function deleteApiKey(provider: string): Promise<void> {
  if (isTauri()) return invoke("delete_api_key", { provider });
  localStorage.removeItem("bp_key_" + provider);
}

/** Used internally by the API layer — never expose a key to logs or the UI. */
export async function readApiKey(provider: string): Promise<string | null> {
  if (isTauri()) return invoke<string | null>("read_api_key", { provider });
  return localStorage.getItem("bp_key_" + provider);
}

/* ----------------------- History (SQLite in native, localStorage in web) -------------- */

export async function addHistory(row: Omit<HistoryRow, "id">): Promise<void> {
  if (isTauri()) {
    await invoke("add_history", { row });
    return;
  }
  const rows = await listHistory();
  rows.unshift({ ...row, id: Date.now() });
  localStorage.setItem("bp_history", JSON.stringify(rows.slice(0, 500)));
}

export async function listHistory(): Promise<HistoryRow[]> {
  if (isTauri()) return invoke<HistoryRow[]>("list_history");
  try {
    return JSON.parse(localStorage.getItem("bp_history") || "[]");
  } catch {
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  if (isTauri()) {
    await invoke("clear_history");
    return;
  }
  localStorage.removeItem("bp_history");
}

/** Delete ALL local data (privacy control). */
export async function wipeAllData(): Promise<void> {
  if (isTauri()) {
    await invoke("wipe_all_data");
    return;
  }
  Object.keys(localStorage)
    .filter((k) => k.startsWith("bp_"))
    .forEach((k) => localStorage.removeItem(k));
}

/* ----------------------- Clipboard + selection (native superpowers) ------------------- */

export async function copyText(text: string): Promise<void> {
  if (isTauri()) {
    const clip = await import("@tauri-apps/plugin-clipboard-manager");
    await clip.writeText(text);
    return;
  }
  await navigator.clipboard.writeText(text);
}

/** Grab whatever text the user has highlighted in any other app (native only). */
export async function captureSelection(): Promise<string> {
  if (isTauri()) return invoke<string>("capture_selection");
  return ""; // not possible in a sandboxed browser
}

/** Type/replace the user's current selection with new text (native only). */
export async function replaceSelection(text: string): Promise<void> {
  if (isTauri()) {
    await invoke("replace_selection", { text });
    return;
  }
  await copyText(text); // best-effort fallback
}

export async function hideFloating(): Promise<void> {
  if (isTauri()) await invoke("hide_floating");
}

/* ----------------------- Desktop preferences (native) ----------------------- */

/** Enable/disable launch-at-startup (native autostart plugin). */
export async function setLaunchAtStartup(enabled: boolean): Promise<void> {
  if (!isTauri()) return;
  try {
    const auto = await import("@tauri-apps/plugin-autostart");
    if (enabled) await auto.enable();
    else await auto.disable();
  } catch (e) {
    console.warn("[Blueprint] autostart unavailable", e);
  }
}

/** Re-register the global shortcut from a settings accelerator like "CmdOrCtrl+Shift+B". */
export async function updateShortcut(accelerator: string): Promise<boolean> {
  if (!isTauri()) return false;
  try {
    return await invoke<boolean>("update_shortcut", { accelerator });
  } catch {
    return false;
  }
}
