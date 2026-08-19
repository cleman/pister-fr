import React from "react";
import { Medal, Wind } from "lucide-react";
import { isLegalWind } from "../lib/marks";

const HEIGHTS = { 1: "7rem", 2: "5rem", 3: "4rem" };
const COLORS = { 1: "var(--lane-yellow)", 2: "#c9ccd1", 3: "#d9a066" };
const ORDER = { 1: 2, 2: 1, 3: 3 }; // ordre visuel : 2e / 1er / 3e

export default function Podium({ top3, onSelectAthlete }) {
  if (top3.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-3 items-end mb-4">
      {top3.map((a) => {
        const legal = isLegalWind(a.wind);
        return (
          <button
            key={a.athleteId}
            onClick={() => onSelectAthlete(a.athleteId)}
            className="focus-ring rounded-md p-3 text-center flex flex-col items-center justify-end"
            style={{ order: ORDER[a.rank], background: "var(--card)", border: "1px solid var(--line)", borderTop: `4px solid ${COLORS[a.rank]}`, minHeight: HEIGHTS[a.rank] }}
          >
            <Medal size={16} style={{ color: COLORS[a.rank] }} className="mb-1" />
            <p className="font-display text-sm truncate w-full" style={{ color: "var(--ink)" }}>{a.name}</p>
            <p className="text-[11px] truncate w-full" style={{ color: "var(--steel)" }}>{a.club}</p>
            <p className="font-mono font-bold text-base mt-1" style={{ color: "var(--ink)" }}>
              {a.markLabel}
              {a.wind !== null && a.wind !== undefined && (
                <span className="font-mono text-[10px] ml-1 flex items-center justify-center gap-0.5" style={{ color: legal ? "var(--steel)" : "var(--track)" }}>
                  <Wind size={9} />{a.wind > 0 ? "+" : ""}{a.wind.toFixed(1)}{!legal ? " NH" : ""}
                </span>
              )}
            </p>
          </button>
        );
      })}
    </div>
  );
}
