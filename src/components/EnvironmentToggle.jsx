import React from "react";

export default function EnvironmentToggle({ environment, onChange }) {
  return (
    <div className="flex rounded-sm overflow-hidden" style={{ border: "1px solid var(--line)" }}>
      {[["outdoor", "Plein air"], ["indoor", "Salle"]].map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className="font-mono text-xs uppercase tracking-wide px-3 py-2"
          style={{ background: environment === key ? "var(--ink)" : "var(--card)", color: environment === key ? "#fff" : "var(--ink)" }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
