import React from "react";
import { DISCIPLINES } from "../data/disciplines";
import { formatMark } from "../lib/marks";

export default function ResultsTable({ disciplineId, entries, onSelectAthlete }) {
  const discipline = DISCIPLINES.find((d) => d.id === disciplineId);
  return (
    <div className="rounded-md overflow-hidden" style={{ border: "1px solid var(--line)", background: "var(--card)" }}>
      {entries.map((r, j) => (
        <button
          key={j}
          onClick={() => onSelectAthlete(r.athleteId)}
          className="focus-ring row-hover w-full text-left flex items-center gap-4 px-4 py-2.5"
          style={{ borderBottom: j !== entries.length - 1 ? "1px solid var(--line)" : "none" }}
        >
          <div className="font-display font-bold text-xs w-7 h-7 rounded-sm flex items-center justify-center shrink-0" style={{ background: r.place === 1 ? "var(--lane-yellow)" : "var(--paper)", color: "var(--ink)", border: "2px solid var(--ink)" }}>{r.place}</div>
          <span className="flex-1 font-display text-sm truncate" style={{ color: "var(--ink)" }}>{r.name}</span>
          <span className="text-xs hidden sm:block shrink-0" style={{ color: "var(--steel)" }}>{r.club}</span>
          <span className="font-mono font-semibold shrink-0" style={{ color: "var(--ink)" }}>
            {formatMark(discipline, r.mark)}
            {discipline && discipline.hasWind && r.wind !== null && r.wind !== undefined && (
              <span className="font-mono text-xs ml-1" style={{ color: "var(--steel)" }}>({r.wind > 0 ? "+" : ""}{r.wind.toFixed(1)})</span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
