import { useState } from "react";
import type { OptimizeResult } from "../lib/optimizer";
import { TIER_LABEL } from "../lib/pricing";
import { money, num, pct } from "../lib/format";
import { copyText } from "../lib/bridge";
import { Card, Badge, RiskMeter, Toast } from "./ui";

/** Renders the full optimization report. Reused on Optimize, Documents, and Floating. */
export default function ResultView({
  result,
  monthlyRuns,
  onReplace,
  compact = false,
}: {
  result: OptimizeResult;
  monthlyRuns: number;
  onReplace?: () => void;
  compact?: boolean;
}) {
  const [toast, setToast] = useState("");
  const r = result;

  return (
    <div className="space-y-4">
      <div className={"grid gap-3 " + (compact ? "grid-cols-2" : "grid-cols-4")}>
        <Metric label="Original" value={num(r.originalTokens) + " tok"} />
        <Metric label="Optimized" value={num(r.optimizedTokens) + " tok"} accent="good" />
        <Metric label="Compression" value={pct(r.compressionPct)} accent="brand" />
        <Metric label="Saved / call" value={money(r.savedPerCall)} accent="gold" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="Readability" value={r.readability + " / 100"} accent={r.readability >= 60 ? "good" : undefined} />
        <Metric label="Quality confidence" value={r.qualityConfidence + "%"} accent={r.qualityConfidence >= 75 ? "good" : r.qualityConfidence >= 45 ? "gold" : undefined} />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold">Optimized prompt</h4>
          <div className="flex gap-2">
            <button
              className="btn btn-primary !py-1.5 !px-3 text-xs"
              onClick={async () => {
                await copyText(r.optimized);
                setToast("Copied to clipboard");
              }}
            >
              Copy
            </button>
            {onReplace && (
              <button className="btn !py-1.5 !px-3 text-xs" onClick={onReplace}>
                Replace selection
              </button>
            )}
          </div>
        </div>
        <pre className="bg-ink-900 border border-line rounded-lg p-3 text-xs font-mono whitespace-pre-wrap text-ink-100 max-h-60 overflow-auto">
          {r.optimized || "—"}
        </pre>
      </Card>

      <div className={"grid gap-4 " + (compact ? "grid-cols-1" : "grid-cols-2")}>
        <Card>
          <RiskMeter value={r.qualityRisk} label={r.qualityRiskLabel} />
          <div className="mt-4">
            <div className="text-xs font-semibold text-slate-400 mb-1">Recommended model</div>
            {r.routing.recommended ? (
              <div className="flex items-center gap-2">
                <Badge tone="brand">{r.routing.recommended.name}</Badge>
                <span className="text-xs text-slate-500">
                  {TIER_LABEL[r.routing.requiredTier]} task · {r.routing.recommended.vendor}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500">—</span>
            )}
          </div>
          {monthlyRuns > 0 && (
            <div className="mt-4 text-xs text-slate-400">
              At <b className="text-ink-100">{num(monthlyRuns)}</b> runs/mo:{" "}
              <b className="text-good">{money(r.savedPerMonth)}/mo</b> ·{" "}
              <b className="text-good">{money(r.savedPerYear)}/yr</b>
            </div>
          )}
        </Card>

        <Card>
          <div className="text-xs font-semibold text-slate-400 mb-2">Removed waste</div>
          {r.waste.length === 0 ? (
            <div className="text-xs text-slate-500">Prompt was already lean — nothing material to cut.</div>
          ) : (
            <ul className="space-y-1.5">
              {r.waste.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="text-good mt-0.5">✓</span>
                  <span>
                    <b>{w.label}</b> <span className="text-slate-500">— {w.detail}</span>{" "}
                    <Badge tone="muted">−{w.tokensSaved}t</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {r.clarityFlags.length > 0 && (
        <Card className="border-warn/40">
          <div className="text-xs font-semibold text-warn mb-2">⚠ Clarity suggestions</div>
          <ul className="space-y-1.5">
            {r.clarityFlags.map((f, i) => (
              <li key={i} className="text-xs">
                <b>{f.label}</b> <span className="text-slate-500">— {f.suggestion}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {toast && <Toast msg={toast} onDone={() => setToast("")} />}
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: "good" | "brand" | "gold" }) {
  const color = accent === "good" ? "text-good" 