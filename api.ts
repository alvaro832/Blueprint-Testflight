@import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap");
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: dark; }
html, body, #root { height: 100%; }
body {
  margin: 0;
  background: #0E0E11;
  color: #ECEAE3;
  font-family: "Inter Tight", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 14px;
  letter-spacing: 0.005em;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3 { font-family: "Fraunces", Georgia, serif; font-weight: 500; letter-spacing: -0.01em; }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: #26262e; border-radius: 6px; }
::-webkit-scrollbar-track { background: transparent; }
textarea, input, select { font-family: inherit; }
*:focus-visible { outline: 2px solid #3b82f6; outline-offset: 1px; }

@layer components {
  .card { @apply bg-ink-850 border border-line rounded-xl; }
  .btn { @apply inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-line bg-transparent text-ink-100 transition-colors; }
  .btn:hover { @apply border-slate-500; }
  .btn-primary { color: #15130d; font-weight: 600; background: var(--accent); border-color: var(--accent); }
  .btn-primary:hover { filter: brightness(1.06); }
  .btn:disabled { @apply opacity-40 cursor-not-allowed; }
  .field { @apply w-full bg-ink-900 border border-line rounded-lg px-3 py-2.5 text-sm text-ink-100 placeholder:text-slate-500; }
  .field:focus { border-color: var(--accent); }
  .label { @apply block mb-2 text-slate-400; font-size: 10.5px; font-weight: 500; letter-spacing: 0.13em; text-transform: uppercase; }
  .badge { @apply inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium; }
}

/* ---- Floating overlay: entrance animation + accessibility ---- */
@keyframes bpOverlayIn {
  from { opacity: 0; transform: translateY(6px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.bp-overlay { animation: bpOverlayIn 120ms cubic-bezier(0.16, 1, 0.3, 1); }

@media (prefers-reduced-motion: reduce) {
  .bp-overlay { animation: none; }
  * { transition: none !important; }
}
@media (prefers-contrast: more) {
  :root { --line: #6b7689; }
  .card, .field { border-color: #6b7689; }
}

/* ---- Runtime accent (set via JS: --accent) + light theme ---- */
:root { --accent: #B08D57; }
.btn-primary { background: var(--accent); border-color: var(--accent); }
.btn-primary:hover { filter: brightness(0.92); }
html.theme-light body { background: #FAF9F6; color: #1A1916; }
html.theme-light .card { background: #ffffff; border-color: #E7E4DD; }
html.theme-light .field { background: #ffffff; border-color: #E7E4DD; color: #1A1916; }
html.theme-light .navitem, html.theme-light aside { color-scheme: light; }
html.theme-light aside.bg-ink-900 { background: #ffffff; }
