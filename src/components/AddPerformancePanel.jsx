import React, { useState } from "react";
import { Plus } from "lucide-react";
import { DISCIPLINES, DISCIPLINE_ALIASES, getLabel } from "../data/disciplines";
import MeasurementField from "./MeasurementField";
import { parseAthleteHistoryText } from "../lib/parsing";

const ROUND_CHOICES = [
  { type: "finale", heat: null, label: "Finale" },
  { type: "demi", heat: 1, label: "Demi-finale" },
  { type: "serie", heat: 1, label: "Série" },
];

export default function AddPerformancePanel({ athlete, competitions, onAddPerformance }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("single"); // 'single' | 'bulk'
  const [gender, setGender] = useState("H");
  const [disciplineId, setDisciplineId] = useState("100");
  const [round, setRound] = useState(ROUND_CHOICES[0]);
  const [mark, setMark] = useState(null);
  const [wind, setWind] = useState(null);
  const [compMode, setCompMode] = useState("existing"); // 'existing' | 'new'
  const [competitionId, setCompetitionId] = useState("");
  const [newCompName, setNewCompName] = useState("");
  const [newCompDate, setNewCompDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [bulkText, setBulkText] = useState("");
  const [bulkRows, setBulkRows] = useState(null);
  const [bulkError, setBulkError] = useState("");

  const discipline = DISCIPLINES.find((d) => d.id === disciplineId);

  async function handleSingleSave() {
    if (typeof mark !== "number" || isNaN(mark) || mark <= 0) { setMsg("Marque manquante ou invalide."); return; }
    if (compMode === "existing" && !competitionId) { setMsg("Choisis une compétition."); return; }
    if (compMode === "new" && (!newCompName.trim() || !newCompDate)) { setMsg("Nom et date de la compétition requis."); return; }
    setBusy(true);
    setMsg("");
    await onAddPerformance({
      athleteId: athlete.id,
      athleteName: athlete.canonicalName,
      athleteClub: athlete.club,
      competitionId: compMode === "existing" ? competitionId : null,
      newCompetition: compMode === "new" ? { name: newCompName.trim(), date: newCompDate, tier: "circuit" } : null,
      disciplineId, gender, round, mark, wind,
    });
    setBusy(false);
    setMsg("Performance ajoutée.");
    setMark(null);
    setWind(null);
  }

  function analyzeBulk() {
    const rows = parseAthleteHistoryText(bulkText, DISCIPLINES, DISCIPLINE_ALIASES);
    if (!rows.length) {
      setBulkError("Aucune ligne reconnue. Assure-toi que chaque ligne contient un libellé de discipline reconnu (ex. \"100m\", \"Longueur\", \"Poids\"...) et une marque.");
      setBulkRows(null);
      return;
    }
    setBulkError("");
    setBulkRows(rows);
  }

  function updateBulkRow(i, patch) {
    setBulkRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function removeBulkRow(i) {
    setBulkRows((rows) => rows.filter((_, idx) => idx !== i));
  }

  async function commitBulk() {
    setBusy(true);
    setMsg("");
    const nameToId = {};
    for (const row of bulkRows) {
      const disc = DISCIPLINES.find((d) => d.id === row.disciplineId);
      if (!disc) continue;
      const key = `${(row.competition || "").trim().toLowerCase()}::${row.date || ""}`;
      let compId = nameToId[key];
      if (!compId) {
        const existing = competitions.find(
          (c) => c.name.trim().toLowerCase() === (row.competition || "").trim().toLowerCase() && c.date === row.date
        );
        if (existing) compId = existing.id;
      }
      const usedId = await onAddPerformance({
        athleteId: athlete.id,
        athleteName: athlete.canonicalName,
        athleteClub: athlete.club,
        competitionId: compId || null,
        newCompetition: compId ? null : { name: row.competition || "Compétition (à préciser)", date: row.date || new Date().toISOString().slice(0, 10), tier: "circuit" },
        disciplineId: row.disciplineId, gender, round: ROUND_CHOICES[0], mark: row.mark, wind: row.wind,
      });
      nameToId[key] = usedId;
    }
    setBusy(false);
    setMsg(`${bulkRows.length} performance(s) ajoutée(s).`);
    setBulkRows(null);
    setBulkText("");
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="focus-ring flex items-center gap-1 font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm mb-4" style={{ background: "var(--track)", color: "#fff" }}>
        <Plus size={13} /> Ajouter une performance
      </button>
    );
  }

  return (
    <div className="rounded-md p-4 mb-4" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex rounded-sm overflow-hidden" style={{ border: "1px solid var(--line)" }}>
          <button type="button" onClick={() => setMode("single")} className="font-mono text-[10px] uppercase px-2 py-1" style={{ background: mode === "single" ? "var(--ink)" : "var(--card)", color: mode === "single" ? "#fff" : "var(--ink)" }}>Une performance</button>
          <button type="button" onClick={() => setMode("bulk")} className="font-mono text-[10px] uppercase px-2 py-1" style={{ background: mode === "bulk" ? "var(--ink)" : "var(--card)", color: mode === "bulk" ? "#fff" : "var(--ink)" }}>Coller un historique</button>
        </div>
        <button onClick={() => setOpen(false)} className="font-mono text-[10px]" style={{ color: "var(--steel)" }}>Fermer</button>
      </div>

      {/* Sexe (commun aux deux modes) */}
      <div className="flex rounded-sm overflow-hidden mb-3" style={{ border: "1px solid var(--line)", width: "fit-content" }}>
        {["H", "F"].map((g) => (
          <button key={g} type="button" onClick={() => setGender(g)} className="font-mono text-xs uppercase px-3 py-1.5" style={{ background: gender === g ? "var(--ink)" : "var(--card)", color: gender === g ? "#fff" : "var(--ink)" }}>{g === "H" ? "Hommes" : "Femmes"}</button>
        ))}
      </div>

      {mode === "single" ? (
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-2">
            <select className="field" value={disciplineId} onChange={(e) => setDisciplineId(e.target.value)}>
              {DISCIPLINES.map((d) => (<option key={d.id} value={d.id}>{getLabel(d, gender)}</option>))}
            </select>
            <div className="flex rounded-sm overflow-hidden" style={{ border: "1px solid var(--line)" }}>
              {ROUND_CHOICES.map((r) => (
                <button key={r.label} type="button" onClick={() => setRound(r)} className="flex-1 font-mono text-[10px] uppercase px-2 py-2" style={{ background: round.type === r.type ? "var(--ink)" : "var(--card)", color: round.type === r.type ? "#fff" : "var(--ink)" }}>{r.label}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MeasurementField discipline={discipline} value={mark} onChange={setMark} />
            {discipline.hasWind && (
              <input type="number" step="0.1" className="field text-center" style={{ width: "4rem" }} placeholder="vent" value={wind === null ? "" : wind} onChange={(e) => setWind(e.target.value === "" ? null : parseFloat(e.target.value))} />
            )}
          </div>

          <div className="flex rounded-sm overflow-hidden" style={{ border: "1px solid var(--line)", width: "fit-content" }}>
            <button type="button" onClick={() => setCompMode("existing")} className="font-mono text-[10px] uppercase px-3 py-1.5" style={{ background: compMode === "existing" ? "var(--ink)" : "var(--card)", color: compMode === "existing" ? "#fff" : "var(--ink)" }}>Compétition existante</button>
            <button type="button" onClick={() => setCompMode("new")} className="font-mono text-[10px] uppercase px-3 py-1.5" style={{ background: compMode === "new" ? "var(--ink)" : "var(--card)", color: compMode === "new" ? "#fff" : "var(--ink)" }}>Nouvelle compétition</button>
          </div>

          {compMode === "existing" ? (
            <select className="field" value={competitionId} onChange={(e) => setCompetitionId(e.target.value)}>
              <option value="">— Choisir —</option>
              {competitions.map((c) => (<option key={c.id} value={c.id}>{c.name} ({new Date(c.date).toLocaleDateString("fr-FR")})</option>))}
            </select>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              <input className="field" placeholder="Nom de la compétition" value={newCompName} onChange={(e) => setNewCompName(e.target.value)} />
              <input className="field" type="date" value={newCompDate} onChange={(e) => setNewCompDate(e.target.value)} />
            </div>
          )}

          {msg && <p className="text-xs font-mono" style={{ color: "var(--steel)" }}>{msg}</p>}
          <button onClick={handleSingleSave} disabled={busy} className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm" style={{ background: "var(--track)", color: "#fff", opacity: busy ? 0.6 : 1 }}>
            Enregistrer
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: "var(--steel)" }}>
            Colle l'historique de performances (ex. copié depuis la fiche athlète du site de la FFA). Chaque ligne doit contenir une discipline reconnue, une marque, et idéalement une date et le nom de la compétition.
          </p>
          <textarea
            className="field font-mono text-xs"
            rows={6}
            placeholder={"100m  10.45  Meeting de Paris  12/06/2026\nLongueur  7.85  Championnats régionaux  03/05/2026"}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <button onClick={analyzeBulk} className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm" style={{ background: "var(--ink)", color: "#fff" }}>Analyser le texte</button>
          {bulkError && <p className="text-xs font-mono" style={{ color: "var(--track)" }}>{bulkError}</p>}

          {bulkRows && (
            <div className="space-y-2">
              <p className="text-xs font-mono" style={{ color: "var(--steel)" }}>{bulkRows.length} ligne(s) reconnue(s) — vérifie avant d'enregistrer :</p>
              {bulkRows.map((row, i) => {
                const disc = DISCIPLINES.find((d) => d.id === row.disciplineId);
                return (
                  <div key={i} className="flex items-center gap-2 flex-wrap p-2 rounded-sm" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
                    <select className="field" style={{ width: "auto" }} value={row.disciplineId} onChange={(e) => updateBulkRow(i, { disciplineId: e.target.value })}>
                      {DISCIPLINES.map((d) => (<option key={d.id} value={d.id}>{getLabel(d, gender)}</option>))}
                    </select>
                    <MeasurementField discipline={disc} value={row.mark} onChange={(v) => updateBulkRow(i, { mark: v })} />
                    <input className="field flex-1 min-w-[8rem]" placeholder="Compétition" value={row.competition} onChange={(e) => updateBulkRow(i, { competition: e.target.value })} />
                    <input className="field" type="date" style={{ width: "9rem" }} value={row.date || ""} onChange={(e) => updateBulkRow(i, { date: e.target.value })} />
                    <button onClick={() => removeBulkRow(i)} className="font-mono text-[10px]" style={{ color: "var(--track)" }}>Retirer</button>
                  </div>
                );
              })}
              {msg && <p className="text-xs font-mono" style={{ color: "var(--steel)" }}>{msg}</p>}
              <button onClick={commitBulk} disabled={busy} className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm" style={{ background: "var(--track)", color: "#fff", opacity: busy ? 0.6 : 1 }}>
                Enregistrer les {bulkRows.length} performances
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
