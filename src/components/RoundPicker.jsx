import React, { useState } from "react";
import { Plus } from "lucide-react";
import { roundKey, roundLabel, compareRounds, nextHeatNumber, OVERVIEW_ROUND } from "../lib/rounds";

const GROUPS = [
  { type: "finale", label: "Finale" },
  { type: "demi", label: "Demi" },
  { type: "serie", label: "Série" },
];

export default function RoundPicker({ blocksForFilter, activeRound, onSelect, showAdd }) {
  const rounds = blocksForFilter.map((b) => b.round).sort(compareRounds);
  const [adding, setAdding] = useState(false);
  const isActive = (r) => activeRound && roundKey(activeRound) === roundKey(r);

  return (
    <div className="space-y-2 mb-4">
      {GROUPS.map((g) => {
        const roundsForGroup = rounds.filter((r) => r.type === g.type);
        if (roundsForGroup.length === 0) return null;
        return (
          <div key={g.type} className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wide w-16 shrink-0" style={{ color: "var(--steel)" }}>{g.label}</span>
            <div className="flex flex-wrap gap-2">
              {roundsForGroup.map((r) => (
                <button key={roundKey(r)} onClick={() => onSelect(r)}
                  className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-1.5 rounded-sm"
                  style={{ background: isActive(r) ? "var(--ink)" : "var(--card)", color: isActive(r) ? "#fff" : "var(--ink)", border: "1px solid var(--line)" }}>
                  {roundLabel(r)}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {rounds.length >= 2 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wide w-16 shrink-0" style={{ color: "var(--steel)" }}>Global</span>
          <button onClick={() => onSelect(OVERVIEW_ROUND)}
            className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-1.5 rounded-sm"
            style={{ background: isActive(OVERVIEW_ROUND) ? "var(--lane-yellow)" : "var(--card)", color: "var(--ink)", border: "1px solid " + (isActive(OVERVIEW_ROUND) ? "var(--lane-yellow)" : "var(--line)") }}>
            {roundLabel(OVERVIEW_ROUND)}
          </button>
        </div>
      )}

      {showAdd && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wide w-16 shrink-0" style={{ color: "var(--steel)" }} />
          {adding ? (
            <div className="flex items-center gap-1">
              <button onClick={() => { onSelect({ type: "finale", heat: nextHeatNumber(rounds, "finale") }); setAdding(false); }} className="focus-ring font-mono text-[10px] uppercase px-2 py-1.5 rounded-sm" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}>Finale</button>
              <button onClick={() => { onSelect({ type: "demi", heat: nextHeatNumber(rounds, "demi") }); setAdding(false); }} className="focus-ring font-mono text-[10px] uppercase px-2 py-1.5 rounded-sm" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}>Demi-finale</button>
              <button onClick={() => { onSelect({ type: "serie", heat: nextHeatNumber(rounds, "serie") }); setAdding(false); }} className="focus-ring font-mono text-[10px] uppercase px-2 py-1.5 rounded-sm" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}>Série</button>
              <button onClick={() => setAdding(false)} className="focus-ring font-mono text-[10px] px-1.5" style={{ color: "var(--steel)" }}>✕</button>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} className="focus-ring flex items-center gap-1 font-mono text-xs uppercase tracking-wide px-3 py-1.5 rounded-sm" style={{ border: "1px dashed var(--line)", color: "var(--steel)" }}>
              <Plus size={12} /> Tour
            </button>
          )}
        </div>
      )}
    </div>
  );
}
