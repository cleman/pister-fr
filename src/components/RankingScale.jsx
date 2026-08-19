import React from "react";

const VERTICAL_IDS = ["hauteur", "perche"];

export default function RankingScale({ discipline, ranking }) {
  if (!discipline || ranking.length < 2) return null;

  const marks = ranking.map((r) => r.mark);
  const better = discipline.type === "time" ? Math.min(...marks) : Math.max(...marks);
  const worse = discipline.type === "time" ? Math.max(...marks) : Math.min(...marks);
  if (better === worse) return null;

  const posFor = (m) => Math.max(0, Math.min(1, (m - worse) / (better - worse)));
  const vertical = VERTICAL_IDS.includes(discipline.id);
  const label = discipline.type === "time" ? "échelle de temps" : vertical ? "échelle de hauteur" : "échelle de distance";

  return (
    <div className="rounded-md p-4 mb-4" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
      <p className="font-mono text-[10px] uppercase tracking-wide mb-3" style={{ color: "var(--steel)" }}>Écarts ({label})</p>
      <div className="space-y-1.5">
        {ranking.map((r) => {
          const t = posFor(r.mark);
          return (
            <div key={r.athleteId} className="flex items-center gap-2">
              <span className="font-mono text-[10px] w-6 text-right shrink-0" style={{ color: "var(--steel)" }}>{r.rank}</span>
              <span className="text-xs w-28 truncate shrink-0" style={{ color: "var(--ink)" }}>{r.name}</span>
              <div className="flex-1 h-2 rounded-sm" style={{ background: "var(--card)" }}>
                <div className="h-2 rounded-sm" style={{ width: `${10 + t * 90}%`, background: r.rank === 1 ? "var(--lane-yellow)" : "var(--track)" }} />
              </div>
              <span className="font-mono text-[10px] w-14 text-right shrink-0" style={{ color: "var(--ink)" }}>{r.markLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
