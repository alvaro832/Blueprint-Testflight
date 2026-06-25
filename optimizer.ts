import React from "react";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={"card p-5 " + className}>{children}</div>;
}

export function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: "good" | "brand" | "gold" }) {
  const color = accent === "good" ? "text-good" : accent === "brand" ? "text-brand" : accent === "gold" ? "text-gold" : "text-ink-100";
  return (
    <Card>
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className={"text-2xl font-extrabold mt-1 tracking-tight " + color}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </Card>
  );
}

export function Badge({ children, tone = "brand" }: { children: React.ReactNode; tone?: "brand" | "good" | "warn" | "bad" | "muted" }) {
  const map: Record<string, string> = {
    brand: "bg-brand-soft text-brand",
    good: "bg-good/10 text-good",
    warn: "bg-warn/10 text-warn",
    bad: "bg-bad/10 text-bad",
    muted: "bg-ink-700 text-slate-300",
  };
  return <span className={"badge " + map[tone]}>{children}</span>;
}

export function RiskMeter({ value, label }: { value: number; label: string }) {
  const tone = value < 25 ? "bg-good" : value < 55 ? "bg-warn" : "bg-bad";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">Quality risk</span>
        <span className="font-semibold">{label} · {value}/100</span>
      </div>
      <div className="h-2 rounded-full bg-ink-700 overflow-hidden">
        <div className={"h-full rounded-full " + tone} style={{ width: Math.max(3, value) + "%" }} />
      </div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-400 text-sm">
      <span className="inline-block w-4 h-4 border-2 border-slate-600 border-t-brand rounded-full animate-spin" />
      {label}
    </div>
  );
}

export function Empty({ title, hint, icon = "✨" }: { title: string; hint: string; icon?: string }) {
  return (
    <div className="text-center py-14 px-6">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-semibold text-ink-100">{title}</div>
      <div className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{hint}</div>
    </div>
  );
}

export function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-ink-700 border border-line px-4 py-2 rounded-lg text-sm shadow-xl z-50">
      {msg}
    </div>
  );
}
