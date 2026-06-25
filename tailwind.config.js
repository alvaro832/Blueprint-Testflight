/** Global app state (Zustand). Settings persist in localStorage; history via the bridge. */
import { create } from "zustand";
import { listHistory, type HistoryRow } from "./bridge";

export type QualityFloor = "strict" | "balanced" | "aggressive";

interface Settings {
  defaultModelId: string;
  monthlyRuns: number;
  level: "balanced" | "aggressive";
  qualityFloor: QualityFloor;
  telemetry: boolean; // always false by default — no tracking
  // desktop experience
  shortcut: string;            // display label for the global hotkey
  theme: "dark" | "light" | "system";
  accent: "bronze" | "graphite" | "ink" | "sage";
  defaultMode: "auto" | "optimize" | "compress" | "reduce" | "clarity";
  autoCopy: boolean;           // copy result automatically after optimizing
  launchAtStartup: boolean;    // start with the OS
  offline: boolean;            // never make network calls (engine is offline anyway)
}

interface AppState {
  settings: Settings;
  history: HistoryRow[];
  totalSaved: number;
  setSettings: (s: Partial<Settings>) => void;
  refreshHistory: () => Promise<void>;
}

const DEFAULTS: Settings = {
  defaultModelId: "gpt-4o",
  monthlyRuns: 10000,
  level: "balanced",
  qualityFloor: "balanced",
  telemetry: false,
  shortcut: "Ctrl/Cmd+Shift+B",
  theme: "dark",
  accent: "bronze",
  defaultMode: "auto",
  autoCopy: false,
  launchAtStartup: true,
  offline: false,
};

function loadSettings(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem("bp_settings") || "{}") };
  } catch {
    return DEFAULTS;
  }
}

export const useStore = create<AppState>((set, get) => ({
  settings: loadSettings(),
  history: [],
  totalSaved: 0,
  setSettings: (s) => {
    const settings = { ...get().settings, ...s };
    localStorage.setItem("bp_settings", JSON.stringify(settings));
    set({ settings });
  },
  refreshHistory: async () => {
    const history = await listHistory();
    const totalSaved = history.reduce((sum, h) => sum + (h.saved_usd || 0), 0);
    set({ history, totalSaved });
  },
}));
