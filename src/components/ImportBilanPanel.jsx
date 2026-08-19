import React, { useState } from "react";
import { Upload, X } from "lucide-react";
import MeasurementField from "./MeasurementField";
import { parseDisciplineBilanText } from "../lib/parsing";

const STATUS_CHOICES = [
  { value: "", label: "Marque" },
  { value: "DNS", label: "DNS" },
  { value: "DNF", label: "DNF" },
  { value: "DQ", label: "DQ" },
];

export default function ImportBilanPanel({ discipline, gender, environment, onImportBilan }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function analyze() {
    const totalLines = text.split(/\r?\n+/).map((l) => l.trim()).filter(Boolean).length;
    const parsed = parseDisciplineBilanText(text, discipline);
    setError("");
    setInfo("");
    if (!parsed.length) {
      setError("Aucune ligne reconnue. Chaque ligne doit contenir un nom, une marque (ou un statut), idéalement une compétition et une date.");
      setRows(null);
      return;
    }
    if (parsed.length < totalLines) {
      setInfo(`${parsed.length} ligne(s) reconnue(s) sur ${totalLines} collée(s).`);
    }
    setRows(parsed);
  }

  function updateRow(i, patch) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeRow(i) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  async function commit() {
    setBusy(true);
    setMsg("");
    for (const row of rows) {
      await onImportBilan({
        athleteName: row.name,
        athleteClub: row.club || "",
        gender,
        disciplineId: discipline.id,
        environment: discipline.indoorEligible ? environment : "outdoor",
        round: { type: "finale", heat: 1 },
        mark: row.status ? null : row.mark,
        wind: row.status ? null : row.wind,
        status: row.status || null,
        place: row.place || null,
        competitionId: null,
        newCompetition: { name: row.competition || "Compétition (à préciser)", date: row.date || new Date().toISOString().slice(0, 10), tier: "circuit" },
      });
    }
    setBusy(false);
    setMsg(`${rows.length} performance(s) importée(s).`);
    setRows(null);
    setText("");
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="focus-ring flex items-center gap-1 font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm mb-4" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}>
        <Upload size={13} /> Importer un bilan
      </button>
    );
  }

  return (
    <div className="rounded-md p-4 mb-4" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-xs uppercase tracking-wide" style={{ color: "var(--steel)" }}>Importer un bilan (résultats hors compétition pour cette discipline)</p>
        <button onClick={() => setOpen(false)} aria-label="Fermer" className="focus-ring" style={{ color: "var(--steel)" }}><X size={14} /></button>
      </div>
      <p className="text-xs mb-3" style={{ color: "var(--steel)" }}>
        Colle une liste de résultats pour <strong>{discipline.label(gender)}</strong> — un athlète différent par ligne, chacun pouvant venir d'une compétition différente (ex. un bilan/classement annuel). Un nouvel athlète est créé automatiquement si nécessaire, tout comme une nouvelle compétition par ligne si besoin. C'est une fonctionnalité récente : vérifie bien le résultat avant d'enregistrer, elle sera sans doute à ajuster avec un vrai exemple.
      </p>
      <textarea
        className="field font-mono text-xs mb-2"
        rows={6}
        placeholder={"1  KPATCHA Hilary  Nice CA  6m98 (+0.9)  Meeting de Paris  12/06/2026\n2  DAVID Yanis  Ca Montreuil  6m86 (+1.6)  Meeting de Lyon  05/06/2026"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={analyze} className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm mb-2" style={{ background: "var(--ink)", color: "#fff" }}>Analyser le texte</button>
      {error && <p className="text-xs font-mono mb-2" style={{ color: "var(--track)" }}>{error}</p>}
      {info && <p className="text-xs font-mono mb-2" style={{ color: "var(--steel)" }}>{info}</p>}

      {rows && (
        <div className="space-y-2">
          <p className="text-xs font-mono" style={{ color: "var(--steel)" }}>{rows.length} ligne(s) reconnue(s) — vérifie avant d'enregistrer :</p>
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap p-2 rounded-sm" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
              <input className="field flex-1 min-w-[8rem]" placeholder="Nom" value={row.name} onChange={(e) => updateRow(i, { name: e.target.value })} />
              <select className="field" style={{ width: "auto" }} value={row.status || ""} onChange={(e) => updateRow(i, { status: e.target.value || null })}>
                {STATUS_CHOICES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
              </select>
              {!row.status && <MeasurementField discipline={discipline} value={row.mark} onChange={(v) => updateRow(i, { mark: v })} />}
              <input type="number" min="1" className="field text-center" style={{ width: "5rem" }} placeholder="Place" value={row.place || ""} onChange={(e) => updateRow(i, { place: e.target.value ? parseInt(e.target.value, 10) : null })} />
              <input className="field flex-1 min-w-[8rem]" placeholder="Compétition" value={row.competition || ""} onChange={(e) => updateRow(i, { competition: e.target.value })} />
              <input className="field" type="date" style={{ width: "9rem" }} value={row.date || ""} onChange={(e) => updateRow(i, { date: e.target.value })} />
              <input className="field flex-1 min-w-[8rem]" placeholder="Club" value={row.club || ""} onChange={(e) => updateRow(i, { club: e.target.value })} />
              <button onClick={() => removeRow(i)} className="font-mono text-[10px]" style={{ color: "var(--track)" }}>Retirer</button>
            </div>
          ))}
          {msg && <p className="text-xs font-mono" style={{ color: "var(--steel)" }}>{msg}</p>}
          <button onClick={commit} disabled={busy} className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm" style={{ background: "var(--track)", color: "#fff", opacity: busy ? 0.6 : 1 }}>
            Enregistrer les {rows.length} performances
          </button>
        </div>
      )}
    </div>
  );
}
