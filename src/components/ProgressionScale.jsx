import React from "react";
import { formatMark } from "../lib/marks";

const VERTICAL_IDS = ["hauteur", "perche"];

export default function ProgressionScale({ discipline, history }) {
  if (!discipline || !history || history.length < 2) return null;

  const marks = history.map((h) => h.mark);
  const better = discipline.type === "time" ? Math.min(...marks) : Math.max(...marks);
  const worse = discipline.type === "time" ? Math.max(...marks) : Math.min(...marks);
  if (better === worse) return null;

  const posFor = (mark) => Math.max(0, Math.min(1, (mark - worse) / (better - worse)));
  const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  const vertical = VERTICAL_IDS.includes(discipline.id);

  const label = discipline.type === "time" ? "échelle de temps" : vertical ? "échelle de hauteur" : "échelle de distance";

  if (vertical) {
    return (
      <div className="rounded-md p-4 mb-4" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
        <p className="font-mono text-[10px] uppercase tracking-wide mb-3" style={{ color: "var(--steel)" }}>Progression ({label})</p>
        <div className="relative" style={{ height: "9rem" }}>
          <div className="absolute left-10 top-0 bottom-0 w-px" style={{ background: "var(--line)" }} />
          {sorted.map((h, i) => {
            const t = posFor(h.mark);
            const isBest = h.mark === better;
            return (
              <div key={i} className="absolute left-0 right-0 flex items-center gap-2" style={{ bottom: `${t * 85}%` }}>
                <span className="font-mono text-[9px] w-9 text-right shrink-0" style={{ color: isBest ? "var(--ink)" : "var(--steel)" }}>{formatMark(discipline, h.mark)}</span>
                <div className="h-0.5 flex-1 rounded-full" style={{ background: isBest ? "var(--lane-yellow)" : "var(--track)", opacity: isBest ? 1 : 0.35 }} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md p-4 mb-4" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
      <p className="font-mono text-[10px] uppercase tracking-wide mb-4" style={{ color: "var(--steel)" }}>Progression ({label})</p>
      <div className="relative" style={{ height: "2.75rem" }}>
        <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: "var(--line)" }} />
        {sorted.map((h, i) => {
          const t = posFor(h.mark);
          const isBest = h.mark === better;
          return (
            <div key={i} className="absolute top-1/2" style={{ left: `${t * 100}%`, transform: "translate(-50%, -50%)" }}>
              <div className="flex flex-col items-center">
                <div className="rounded-full" style={{ width: isBest ? "8px" : "6px", height: isBest ? "8px" : "6px", background: isBest ? "var(--lane-yellow)" : "var(--track)", opacity: isBest ? 1 : 0.5 }} />
                <span className="font-mono text-[9px] mt-1 whitespace-nowrap" style={{ color: isBest ? "var(--ink)" : "var(--steel)" }}>{formatMark(discipline, h.mark)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2">
        <span className="font-mono text-[9px]" style={{ color: "var(--steel)" }}>{formatMark(discipline, worse)}</span>
        <span className="font-mono text-[9px]" style={{ color: "var(--steel)" }}>{formatMark(discipline, better)}</span>
      </div>
    </div>
  );
}
