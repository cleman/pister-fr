import React, { useState } from "react";
import { BarChart3, Circle } from "lucide-react";
import { formatMark } from "../lib/marks";

const VERTICAL_IDS = ["hauteur", "perche"];

/**
 * points: [{ mark, info }] — `info` est le texte affiché au clic (date,
 * nom d'athlète, ou nom + date + lieu selon le contexte d'appel).
 */
export default function MarkScale({ discipline, points, title }) {
  const [mode, setMode] = useState("dots"); // 'dots' | 'bars'
  const [activeIdx, setActiveIdx] = useState(null);

  if (!discipline || !points || points.length < 2) return null;
  const marks = points.map((p) => p.mark);
  const better = discipline.type === "time" ? Math.min(...marks) : Math.max(...marks);
  const worse = discipline.type === "time" ? Math.max(...marks) : Math.min(...marks);
  if (better === worse) return null;

  const posFor = (m) => Math.max(0, Math.min(1, (m - worse) / (better - worse)));
  const vertical = mode === "dots" && VERTICAL_IDS.includes(discipline.id);
  const scaleLabel = discipline.type === "time" ? "échelle de temps" : VERTICAL_IDS.includes(discipline.id) ? "échelle de hauteur" : "échelle de distance";

  function toggle(i) {
    setActiveIdx((cur) => (cur === i ? null : i));
  }

  return (
    <div className="rounded-md p-4 mb-4" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: "var(--steel)" }}>{title || scaleLabel}</p>
        <div className="flex rounded-sm overflow-hidden" style={{ border: "1px solid var(--line)" }}>
          <button onClick={() => setMode("dots")} aria-label="Vue points" className="focus-ring p-1.5" style={{ background: mode === "dots" ? "var(--ink)" : "var(--card)", color: mode === "dots" ? "#fff" : "var(--steel)" }}><Circle size={12} /></button>
          <button onClick={() => setMode("bars")} aria-label="Vue barres" className="focus-ring p-1.5" style={{ background: mode === "bars" ? "var(--ink)" : "var(--card)", color: mode === "bars" ? "#fff" : "var(--steel)" }}><BarChart3 size={12} /></button>
        </div>
      </div>

      {mode === "bars" ? (
        <div className="space-y-1.5">
          {points.map((p, i) => {
            const t = posFor(p.mark);
            const isBest = p.mark === better;
            return (
              <div key={i}>
                <button onClick={() => toggle(i)} className="focus-ring w-full flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-sm" style={{ background: "var(--card)" }}>
                    <div className="h-2 rounded-sm" style={{ width: `${10 + t * 90}%`, background: isBest ? "var(--lane-yellow)" : "var(--track)" }} />
                  </div>
                  <span className="font-mono text-[10px] w-14 text-right shrink-0" style={{ color: "var(--ink)" }}>{formatMark(discipline, p.mark)}</span>
                </button>
                {activeIdx === i && <p className="font-mono text-[10px] mt-0.5" style={{ color: "var(--track)" }}>{p.info}</p>}
              </div>
            );
          })}
        </div>
      ) : vertical ? (
        <div className="relative" style={{ height: "9rem" }}>
          <div className="absolute left-10 top-0 bottom-0 w-px" style={{ background: "var(--line)" }} />
          {points.map((p, i) => {
            const t = posFor(p.mark);
            const isBest = p.mark === better;
            return (
              <div key={i} className="absolute left-0 right-0 flex items-center gap-2" style={{ bottom: `${t * 85}%` }}>
                <span className="font-mono text-[9px] w-9 text-right shrink-0" style={{ color: isBest ? "var(--ink)" : "var(--steel)" }}>{formatMark(discipline, p.mark)}</span>
                <button onClick={() => toggle(i)} className="focus-ring flex-1 flex items-center h-3">
                  <div className="rounded-full" style={{ width: "8px", height: "8px", background: isBest ? "var(--lane-yellow)" : "var(--track)", opacity: isBest ? 1 : 0.6 }} />
                </button>
                {activeIdx === i && <span className="font-mono text-[9px]" style={{ color: "var(--track)" }}>{p.info}</span>}
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <div className="relative" style={{ height: "2.75rem" }}>
            <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: "var(--line)" }} />
            {points.map((p, i) => {
              const t = posFor(p.mark);
              const isBest = p.mark === better;
              return (
                <button key={i} onClick={() => toggle(i)} className="focus-ring absolute top-1/2" style={{ left: `${t * 100}%`, transform: "translate(-50%, -50%)" }}>
                  <div className="flex flex-col items-center">
                    <div className="rounded-full" style={{ width: isBest ? "8px" : "6px", height: isBest ? "8px" : "6px", background: isBest ? "var(--lane-yellow)" : "var(--track)", opacity: isBest ? 1 : 0.6 }} />
                    <span className="font-mono text-[9px] mt-1 whitespace-nowrap" style={{ color: isBest ? "var(--ink)" : "var(--steel)" }}>{formatMark(discipline, p.mark)}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {activeIdx !== null && <p className="font-mono text-[10px] mt-2 text-center" style={{ color: "var(--track)" }}>{points[activeIdx].info}</p>}
          <div className="flex justify-between mt-1">
            <span className="font-mono text-[9px]" style={{ color: "var(--steel)" }}>{formatMark(discipline, worse)}</span>
            <span className="font-mono text-[9px]" style={{ color: "var(--steel)" }}>{formatMark(discipline, better)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
