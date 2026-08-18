import React, { useState } from "react";
import { findAthleteMatches } from "../lib/athletes";

export default function NameField({ value, onChange, athletes, placeholder }) {
  const [open, setOpen] = useState(false);
  const matches = value && value.trim().length >= 2 ? findAthleteMatches(value, athletes, 4) : [];
  return (
    <div className="relative flex-1 min-w-0">
      <input
        className="field"
        placeholder={placeholder || "Nom Prénom"}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 rounded-sm z-10 overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--line)", boxShadow: "0 4px 12px rgba(20,23,31,0.15)" }}>
          {matches.map((a) => (
            <button
              key={a.id}
              type="button"
              onMouseDown={() => { onChange(a.canonicalName); setOpen(false); }}
              className="focus-ring w-full text-left px-3 py-2 text-xs"
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              <span className="font-display" style={{ color: "var(--ink)" }}>{a.canonicalName}</span>
              {a.club && <span style={{ color: "var(--steel)" }}> · {a.club}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
