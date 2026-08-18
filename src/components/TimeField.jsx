import React from "react";
import { CLOCK_IDS } from "../lib/time";

export default function TimeField({ disciplineId, valueSeconds, onChange, flagged }) {
  const clock = CLOCK_IDS.includes(disciplineId);
  const total = typeof valueSeconds === "number" && !isNaN(valueSeconds) ? valueSeconds : null;
  const min = clock && total !== null ? Math.floor(total / 60) : "";
  const remainder = total !== null ? total - (clock ? Math.floor(total / 60) * 60 : 0) : null;
  const secWhole = remainder !== null ? Math.floor(remainder) : "";
  const cs = remainder !== null ? Math.round((remainder - Math.floor(remainder)) * 100) : "";

  function commit(nextMin, nextSec, nextCs) {
    const m = clock ? (parseInt(nextMin, 10) || 0) : 0;
    const s = parseInt(nextSec, 10);
    const c = parseInt(nextCs, 10);
    if (isNaN(s)) { onChange(null); return; }
    onChange(m * 60 + s + (isNaN(c) ? 0 : c) / 100);
  }

  const inputStyle = { width: "2.6rem", padding: "6px 2px" };
  return (
    <div className="flex items-center gap-1 shrink-0">
      {clock && (
        <>
          <input type="number" min="0" className="field text-center" style={inputStyle} value={min} placeholder="mn"
            onChange={(e) => commit(e.target.value, secWhole === "" ? 0 : secWhole, cs === "" ? 0 : cs)} />
          <span className="font-mono text-xs" style={{ color: "var(--steel)" }}>:</span>
        </>
      )}
      <input type="number" min="0" max="59" className="field text-center" style={inputStyle} value={secWhole} placeholder="s"
        onChange={(e) => commit(min === "" ? 0 : min, e.target.value, cs === "" ? 0 : cs)} />
      <span className="font-mono text-xs" style={{ color: "var(--steel)" }}>.</span>
      <input type="number" min="0" max="99" className="field text-center" style={inputStyle} value={cs} placeholder="c"
        onChange={(e) => commit(min === "" ? 0 : min, secWhole === "" ? 0 : secWhole, e.target.value)} />
      {flagged && <span className="font-mono text-[10px]" style={{ color: "var(--track)" }}>à vérifier</span>}
    </div>
  );
}
