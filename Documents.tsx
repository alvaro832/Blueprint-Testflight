import { useEffect } from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { useStore } from "./lib/store";
import { useEffect as _useEffectTheme } from "react";
import { isTauri } from "./lib/bridge";
import Dashboard from "./screens/Dashboard";
import Optimize from "./screens/Optimize";
import Documents from "./screens/Documents";
import History from "./screens/History";
import Settings from "./screens/Settings";
import ModelRouter from "./screens/ModelRouter";
import ExportScreen from "./screens/Export";

const NAV = [
  { to: "/", label: "Dashboard", icon: "▤", end: true },
  { to: "/optimize", label: "Optimize", icon: "✦" },
  { to: "/documents", label: "Documents", icon: "▢" },
  { to: "/history", label: "History", icon: "◷" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];
const SECONDARY = [
  { to: "/router", label: "Model Router", icon: "⇄" },
  { to: "/export", label: "Export", icon: "↧" },
];

export default function App() {
  const refreshHistory = useStore((s) => s.refreshHistory);
  const navigate = useNavigate();
  const theme = useStore((s) => s.settings.theme);
  const accent = useStore((s) => s.settings.accent);
  _useEffectTheme(() => {
    const root = document.documentElement;
    const sysDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
    const dark = theme === "dark" || (theme === "system" && sysDark);
    root.classList.toggle("theme-light", !dark);
    const accents: Record<string, string> = { bronze: "#B08D57", graphite: "#9b9aa3", ink: "#6f7d96", sage: "#A6B5A0" };
    root.style.setProperty("--accent", accents[accent] ?? accents.bronze);
  }, [theme, accent]);

  useEffect(() => {
    refreshHistory();
    // Listen for the tray hotkey / menu "open optimize" event in the native build.
    if (isTauri()) {
      import("@tauri-apps/api/event").then(({ listen }) => {
        listen("open-optimize", () => navigate("/optimize"));
      });
    }
  }, [refreshHistory, navigate]);

  return (
    <div className="grid grid-cols-[230px_1fr] h-screen">
      <aside className="bg-ink-900 border-r border-line flex flex-col p-3">
        <div className="flex items-center gap-2.5 px-2 py-3 mb-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-gold grid place-items-center text-white font-black text-sm">B</div>
          <div className="font-serif font-medium tracking-tight text-lg">Blueprint</div>
        </div>

        <nav className="space-y-1">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={navClass}>
              <span className="w-5 text-center opacity-80">{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 px-3 mt-5 mb-1">Tools</div>
        <nav className="space-y-1">
          {SECONDARY.map((n) => (
            <NavLink key={n.to} to={n.to} className={navClass}>
              <span className="w-5 text-center opacity-80">{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <button className="btn btn-primary w-full" onClick={() => navigate("/optimize")}>
            ✦ Optimize Prompt
          </button>
          <div className="text-[11px] text-slate-600 mt-3 px-1 leading-relaxed">
            {isTauri() ? "Hotkey: Ctrl/Cmd + Shift + B" : "Web preview · native features off"}
          </div>
        </div>
      </aside>

      <main className="overflow-auto">
        <div className="max-w-5xl mx-auto px-7 py-7">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/optimize" element={<Optimize />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/router" element={<ModelRouter />} />
            <Route path="/export" element={<ExportScreen />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return (
    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors " +
    (isActive ? "bg-brand-soft text-brand" : "text-slate-400 hover:text-ink-100 hover:bg-ink-800")
  );
}
