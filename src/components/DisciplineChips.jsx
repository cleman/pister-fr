import React from "react";
import { disciplinesByCategory, getLabel } from "../data/disciplines";

export default function DisciplineChips({ gender, activeId, onSelect, hasDataFor }) {
  const groups = disciplinesByCategory(gender);
  return (
    <div className="space-y-2">
      {groups.map((cat) => (
        <div key={cat.id} className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wide w-24 shrink-0" style={{ color: "var(--steel)" }}>{cat.label}</span>
          <div className="flex flex-wrap gap-2">
            {cat.disciplines.map((d) => {
              const active = activeId === d.id;
              const has = hasDataFor ? hasDataFor(d) : false;
              return (
                <button key={d.id} onClick={() => onSelect(d.id)}
                  className="focus-ring relative font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm"
                  style={{ background: active ? "var(--track)" : "var(--card)", color: active ? "#fff" : "var(--ink)", border: "1px solid " + (active ? "var(--track)" : "var(--line)") }}>
                  {getLabel(d, gender)}
                  {has && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: active ? "#fff" : "var(--lane-yellow)" }} />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
