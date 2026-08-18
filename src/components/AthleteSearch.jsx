import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { normalizeName } from "../lib/athletes";

export default function AthleteSearch({ athletes, onSelectAthlete }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const norm = normalizeName(query);
  const matches = norm.length >= 2
    ? athletes.filter((a) => normalizeName(a.canonicalName).includes(norm) || normalizeName(a.club || "").includes(norm)).slice(0, 8)
    : [];

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 rounded-sm px-2 py-1.5" style={{ border: "1px solid rgba(255,255,255,0.25)" }}>
        <Search size={13} style={{ color: "var(--lane-yellow)" }} />
        <input
          className="bg-transparent border-none outline-none font-mono text-xs text-white w-28 sm:w-44"
          placeholder="Chercher un athlète…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {query && (
          <button type="button" onMouseDown={() => setQuery("")} aria-label="Effacer la recherche" style={{ color: "rgba(255,255,255,0.5)" }}>
            <X size={12} />
          </button>
        )}
      </div>
      {open && matches.length > 0 && (
        <div className="absolute right-0 mt-1 w-64 rounded-sm overflow-hidden z-30" style={{ background: "var(--card)", border: "1px solid var(--line)", boxShadow: "0 8px 24px rgba(20,23,31,0.25)" }}>
          {matches.map((a) => (
            <button
              key={a.id}
              type="button"
              onMouseDown={() => { onSelectAthlete(a.id); setQuery(""); setOpen(false); }}
              className="focus-ring w-full text-left px-3 py-2 text-xs"
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              <span className="font-display" style={{ color: "var(--ink)" }}>{a.canonicalName}</span>
              {a.club && <span style={{ color: "var(--steel)" }}> · {a.club}</span>}
            </button>
          ))}
        </div>
      )}
      {open && norm.length >= 2 && matches.length === 0 && (
        <div className="absolute right-0 mt-1 w-64 rounded-sm p-3 text-xs font-mono z-30" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--steel)" }}>
          Aucun athlète trouvé.
        </div>
      )}
    </div>
  );
}
