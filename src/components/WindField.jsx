import React from "react";

export default function WindField({ value, onChange }) {
  return (
    <input
      type="number"
      step="0.1"
      className="field text-center shrink-0"
      style={{ width: "3.4rem", padding: "6px 2px" }}
      placeholder="vent"
      value={value === null || value === undefined ? "" : value}
      onChange={(e) => { const v = e.target.value; onChange(v === "" ? null : parseFloat(v)); }}
    />
  );
}
