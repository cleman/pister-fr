import React, { useState } from "react";
import { Plus } from "lucide-react";
import { roundKey, roundLabel, compareRounds, nextHeatNumber } from "../lib/rounds";

export default function RoundPicker({ blocksForFilter, activeRound, onSelect, showAdd }) {
  const rounds = blocksForFilter.map((b) => b.round).sort(compareRounds);
  const [adding, setAdding] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {rounds.map((r) => (
        <button
          key={roundKey(r)}
          onClick={() => onSelect(r)}
          className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-1.5 rounded-sm"
          style={{
            background: activeRound && roundKey(activeRound) === roundKey(r) ? "var(--ink)" : "var(--card)",
            color: activeRound && roundKey(activeRound) === roundKey(r) ? "#fff" : "var(--ink)",
            border: "1px solid var(--line)",
          }}
        >
          {roundLabel(r)}
        </button>
      ))}
      {showAdd && (
        adding ? (
          <div className="flex items-center gap-1">
            <button onClick={() => { onSelect({ type: "finale", heat: null }); setAdding(false); }} className="focus-ring font-mono text-[10px] uppercase px-2 py-1.5 rounded-sm" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}>Finale</button>
            <button onClick={() => { onSelect({ type: "demi", heat: nextHeatNumber(rounds, "demi") }); setAdding(false); }} className="focus-ring font-mono text-[10px] uppercase px-2 py-1.5 rounded-sm" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}>Demi-finale</button>
            <button onClick={() => { onSelect({ type: "serie", heat: nextHeatNumber(rounds, "serie") }); setAdding(false); }} className="focus-ring font-mono text-[10px] uppercase px-2 py-1.5 rounded-sm" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}>Série</button>
            <button onClick={() => setAdding(false)} className="focus-ring font-mono text-[10px] px-1.5" style={{ color: "var(--steel)" }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="focus-ring flex items-center gap-1 font-mono text-xs uppercase tracking-wide px-3 py-1.5 rounded-sm" style={{ border: "1px dashed var(--line)", color: "var(--steel)" }}>
            <Plus size={12} /> Tour
          </button>
        )
      )}
    </div>
  );
}
