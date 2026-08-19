import React from "react";
import { DISCIPLINES } from "../data/disciplines";
import { markDisplay, isLegalWind } from "../lib/marks";
import { Trash2 } from "lucide-react";

export default function ResultsTable({ disciplineId, entries, onSelectAthlete, onDeleteEntry }) {
  const discipline = DISCIPLINES.find((d) => d.id === disciplineId);
  return (
    <div className="rounded-md overflow-hidden" style={{ border: "1px solid var(--line)", background: "var(--card)" }}>
      {entries.map((r, j) => {
        const legal = isLegalWind(r.wind);
        return (
          <div key={j} className="flex items-center gap-1" style={{ borderBottom: j !== entries.length - 1 ? "1px solid var(--line)" : "none" }}>
            <button
              onClick={() => onSelectAthlete(r.athleteId)}
              className="focus-ring row-hover flex-1 min-w-0 text-left flex items-center gap-4 px-4 py-2.5"
            >
              <div className="font-display font-bold text-xs w-7 h-7 rounded-sm flex items-center justify-center shrink-0" style={{ background: r.place === 1 ? "var(--lane-yellow)" : "var(--paper)", color: "var(--ink)", border: "2px solid var(--ink)" }}>{r.status ? "—" : r.place}</div>
              <span className="flex-1 font-display text-sm truncate" style={{ color: "var(--ink)" }}>{r.name}</span>
              <span className="text-xs hidden sm:block shrink-0" style={{ color: "var(--steel)" }}>{r.club}</span>
              <span className="font-mono font-semibold shrink-0" style={{ color: r.status ? "var(--track)" : "var(--ink)" }}>
                {markDisplay(discipline, r)}
                {!r.status && discipline && discipline.hasWind && r.wind !== null && r.wind !== undefined && (
                  <span className="font-mono text-xs ml-1" style={{ color: legal ? "var(--steel)" : "var(--track)" }}>
                    ({r.wind > 0 ? "+" : ""}{r.wind.toFixed(1)}{!legal ? " NH" : ""})
                  </span>
                )}
              </span>
            </button>
            {onDeleteEntry && (
              <button onClick={() => onDeleteEntry(r.athleteId)} aria-label="Supprimer cette performance" className="focus-ring p-1.5 mr-2 rounded-sm shrink-0" style={{ color: "var(--steel)" }}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
