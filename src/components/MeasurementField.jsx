import React from "react";
import TimeField from "./TimeField";

export default function MeasurementField({ discipline, value, onChange, flagged }) {
  if (discipline.type === "time") {
    return <TimeField disciplineId={discipline.id} valueSeconds={value} onChange={onChange} flagged={flagged} />;
  }

  if (discipline.type === "points") {
    return (
      <div className="flex items-center gap-1 shrink-0">
        <input
          type="number" min="0" step="1" className="field text-center" style={{ width: "4.5rem", padding: "6px 4px" }}
          placeholder="pts"
          value={value === null || value === undefined ? "" : value}
          onChange={(e) => { const v = e.target.value; onChange(v === "" ? null : parseInt(v, 10)); }}
        />
        <span className="font-mono text-xs" style={{ color: "var(--steel)" }}>pts</span>
        {flagged && <span className="font-mono text-[10px]" style={{ color: "var(--track)" }}>à vérifier</span>}
      </div>
    );
  }

  // distance (sauts/lancers), en mètres avec 2 décimales
  return (
    <div className="flex items-center gap-1 shrink-0">
      <input
        type="number" min="0" step="0.01" className="field text-center" style={{ width: "4.5rem", padding: "6px 4px" }}
        placeholder="0.00"
        value={value === null || value === undefined ? "" : value}
        onChange={(e) => { const v = e.target.value; onChange(v === "" ? null : parseFloat(v)); }}
      />
      <span className="font-mono text-xs" style={{ color: "var(--steel)" }}>m</span>
      {flagged && <span className="font-mono text-[10px]" style={{ color: "var(--track)" }}>à vérifier</span>}
    </div>
  );
}
