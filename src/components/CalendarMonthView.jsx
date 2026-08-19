import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TIERS } from "../data/competitions";

const WEEKDAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export default function CalendarMonthView({ competitions, onOpen }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // lundi = premier jour de semaine
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDate = {};
  competitions.forEach((c) => {
    const d = new Date(c.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate();
      byDate[key] = byDate[key] || [];
      byDate[key].push(c);
    }
  });

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Mois précédent" className="focus-ring p-1.5 rounded-sm" style={{ border: "1px solid var(--line)" }}><ChevronLeft size={14} /></button>
        <p className="font-display text-lg" style={{ color: "var(--ink)" }}>{MONTHS[month]} {year}</p>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Mois suivant" className="focus-ring p-1.5 rounded-sm" style={{ border: "1px solid var(--line)" }}><ChevronRight size={14} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (<div key={w} className="font-mono text-[10px] uppercase text-center" style={{ color: "var(--steel)" }}>{w}</div>))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => (
          <div key={i} className="rounded-sm p-1" style={{ minHeight: "4.5rem", border: d ? "1px solid var(--line)" : "none", background: d ? "var(--card)" : "transparent", outline: d && isCurrentMonth && d === today.getDate() ? "2px solid var(--track)" : "none" }}>
            {d && (
              <>
                <p className="font-mono text-[10px] mb-1" style={{ color: "var(--steel)" }}>{d}</p>
                <div className="space-y-0.5">
                  {(byDate[d] || []).slice(0, 3).map((c) => (
                    <button key={c.id} onClick={() => onOpen(c.id, "view")} className="focus-ring w-full text-left font-mono text-[9px] uppercase px-1 py-0.5 rounded-sm truncate block" style={TIERS[c.tier].style} title={c.name}>
                      {c.name}
                    </button>
                  ))}
                  {(byDate[d] || []).length > 3 && <p className="font-mono text-[9px]" style={{ color: "var(--steel)" }}>+{byDate[d].length - 3}</p>}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
