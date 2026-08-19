import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DISCIPLINES, getLabel } from "../data/disciplines";
import { roundLabel, envLabel } from "../lib/rounds";
import { parseTextTable } from "../lib/parsing";
import { compareMarks } from "../lib/marks";
import NameField from "./NameField";
import MeasurementField from "./MeasurementField";
import WindField from "./WindField";

export default function ResultBlockForm({ initial, athletes, onSave, onCancel, lockedDisciplineId, lockedGender, lockedEnvironment, lockedRound }) {
  const isLocked = !!(lockedDisciplineId && lockedGender);
  const [disciplineId, setDisciplineId] = useState(lockedDisciplineId || (initial ? initial.disciplineId : "100"));
  const [gender, setGender] = useState(lockedGender || (initial ? initial.gender : "H"));
  const [rows, setRows] = useState(
    initial && initial.entries.length
      ? initial.entries.map((e, i) => ({ place: i + 1, name: e.name, club: e.club, mark: e.mark, wind: e.wind === undefined ? null : e.wind }))
      : [{ place: 1, name: "", club: "", mark: null, wind: null }]
  );
  const [importError, setImportError] = useState("");
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const activeDisciplineId = isLocked ? lockedDisciplineId : disciplineId;
  const activeGender = isLocked ? lockedGender : gender;
  const activeDiscipline = DISCIPLINES.find((d) => d.id === activeDisciplineId);

  function addRow() { setRows((r) => [...r, { place: r.length + 1, name: "", club: "", mark: null, wind: null }]); }
  function updateRow(i, patch) { setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row))); }
  function removeRow(i) { setRows((r) => r.filter((_, idx) => idx !== i).map((row, idx) => ({ ...row, place: idx + 1 }))); }

  function handlePasteAnalyze() {
    const parsed = parseTextTable(pasteText, activeDiscipline);
    if (!parsed.length) {
      setImportError("Aucune ligne reconnue dans le texte collé. Il faut au moins 2 espaces (ou une tabulation) entre chaque colonne.");
      return;
    }
    setRows(parsed.map((p, i) => ({ place: p.place || i + 1, name: p.name || "", club: p.club || "", mark: p.mark, wind: p.wind === undefined ? null : p.wind })));
    setImportError("");
    setPasteText("");
    setPasteMode(false);
  }

  function handleSave() {
    const clean = rows
      .filter((r) => r.name.trim() && typeof r.mark === "number" && !isNaN(r.mark) && r.mark > 0)
      .sort((a, b) => compareMarks(activeDiscipline, a.mark, b.mark))
      .map((r, i) => ({ place: i + 1, name: r.name.trim(), club: r.club.trim(), mark: r.mark, wind: r.wind === undefined ? null : r.wind }));
    if (clean.length === 0) return;
    onSave({ disciplineId: activeDisciplineId, gender: activeGender, environment: lockedEnvironment || "outdoor", round: lockedRound, entries: clean });
    if (!initial) setRows([{ place: 1, name: "", club: "", mark: null, wind: null }]);
  }

  return (
    <div className="rounded-md p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
      {isLocked ? (
        <p className="font-mono text-xs uppercase tracking-wide mb-4" style={{ color: "var(--steel)" }}>
          {activeDiscipline ? getLabel(activeDiscipline, activeGender) : activeDisciplineId} · {activeGender === "H" ? "Hommes" : "Femmes"}{activeDiscipline && activeDiscipline.indoorEligible ? ` · ${envLabel(lockedEnvironment)}` : ""} · {roundLabel(lockedRound)}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <select className="field" value={disciplineId} onChange={(e) => setDisciplineId(e.target.value)}>
            {DISCIPLINES.map((d) => (<option key={d.id} value={d.id}>{getLabel(d, gender)}</option>))}
          </select>
          <div className="flex rounded-sm overflow-hidden" style={{ border: "1px solid var(--line)" }}>
            {["H", "F"].map((g) => (
              <button key={g} type="button" onClick={() => setGender(g)} className="focus-ring flex-1 font-mono text-xs uppercase tracking-wide py-2" style={{ background: gender === g ? "var(--ink)" : "transparent", color: gender === g ? "#fff" : "var(--ink)" }}>{g === "H" ? "Hommes" : "Femmes"}</button>
            ))}
          </div>
        </div>
      )}

      {importError && <p className="text-xs font-mono mb-2" style={{ color: "var(--track)" }}>{importError}</p>}

      <button type="button" onClick={() => setPasteMode((v) => !v)} className="focus-ring font-mono text-[10px] uppercase tracking-wide underline mb-3" style={{ color: "var(--steel)" }}>
        {pasteMode ? "Masquer le collage de texte" : "Coller le texte des résultats à la place de la saisie ligne par ligne"}
      </button>
      {pasteMode && (
        <div className="mb-4">
          <textarea
            className="field font-mono text-xs"
            rows={5}
            placeholder={"Sélectionne et copie le tableau depuis la page web, puis colle-le ici\n(garde au moins 2 espaces ou une tabulation entre chaque colonne)"}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <button type="button" onClick={handlePasteAnalyze} className="focus-ring mt-2 font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm" style={{ background: "var(--ink)", color: "#fff" }}>
            Analyser le texte
          </button>
        </div>
      )}

      <div className="space-y-2 mb-3">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="font-mono text-xs text-center w-6 shrink-0" style={{ color: "var(--steel)" }}>{row.place}</span>
            <NameField value={row.name} onChange={(v) => updateRow(i, { name: v })} athletes={athletes || []} />
            <input className="field flex-1 min-w-0" placeholder="Club" value={row.club} onChange={(e) => updateRow(i, { club: e.target.value })} />
            <MeasurementField discipline={activeDiscipline} value={row.mark} flagged={row.flagged} onChange={(v) => updateRow(i, { mark: v, flagged: false })} />
            {activeDiscipline && activeDiscipline.hasWind && (
              <WindField value={row.wind} onChange={(v) => updateRow(i, { wind: v })} />
            )}
            <button onClick={() => removeRow(i)} aria-label="Supprimer la ligne" className="focus-ring p-1.5 rounded-sm shrink-0" style={{ color: "var(--steel)" }}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={addRow} className="focus-ring flex items-center gap-1 font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}><Plus size={13} /> Ajouter une ligne</button>
        <button onClick={handleSave} className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm" style={{ background: "var(--track)", color: "#fff" }}>{initial ? "Mettre à jour" : "Enregistrer ce tableau"}</button>
        {onCancel && (<button onClick={onCancel} className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm" style={{ color: "var(--steel)" }}>Annuler</button>)}
      </div>
    </div>
  );
}
