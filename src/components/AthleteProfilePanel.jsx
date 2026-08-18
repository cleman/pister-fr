import React, { useMemo, useState } from "react";
import { X, Calendar, Trash2, Filter } from "lucide-react";
import { DISCIPLINES, getLabel } from "../data/disciplines";
import { formatMark, isBetterMark } from "../lib/marks";
import { roundLabel } from "../lib/rounds";
import { getAthleteHistory } from "../lib/ranking";
import { useAuth } from "../lib/auth";
import AddPerformancePanel from "./AddPerformancePanel";

export default function AthleteProfilePanel({ athleteId, athletes, resultsStore, competitions, onClose, onOpenCompetition, onAddPerformance, onSetGender, onDeletePerformance }) {
  const { canEdit, isAdmin } = useAuth();
  const athlete = athletes.find((a) => a.id === athleteId);
  const [historyFilter, setHistoryFilter] = useState(null); // `${disciplineId}-${gender}` ou null
  const history = useMemo(() => getAthleteHistory(athleteId, resultsStore, competitions), [athleteId, resultsStore, competitions]);
  const bests = useMemo(() => {
    const map = {};
    history.forEach((h) => {
      const disc = DISCIPLINES.find((d) => d.id === h.disciplineId);
      if (!disc) return;
      const key = `${h.disciplineId}-${h.gender}`;
      if (!map[key] || isBetterMark(disc, h.mark, map[key].mark)) map[key] = h;
    });
    return Object.values(map).sort((a, b) => a.disciplineId.localeCompare(b.disciplineId));
  }, [history]);
  const visibleHistory = historyFilter ? history.filter((h) => `${h.disciplineId}-${h.gender}` === historyFilter) : history;

  if (!athlete) return null;

  function handleDelete(h) {
    if (!window.confirm(`Supprimer cette performance (${h.compName}) ? Cette action est irréversible.`)) return;
    onDeletePerformance(h.compId, h.disciplineId, h.gender, h.round);
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0" style={{ background: "rgba(20,23,31,0.5)" }} onClick={onClose} />
      <div className="relative w-full sm:w-96 h-full overflow-y-auto" style={{ background: "var(--card)" }}>
        <div className="p-5" style={{ background: "var(--ink)" }}>
          <button onClick={onClose} aria-label="Fermer la fiche athlète" className="focus-ring float-right p-1 rounded-sm" style={{ color: "#fff" }}><X size={20} /></button>
          <p className="font-mono text-xs uppercase tracking-wider mb-1" style={{ color: "var(--lane-yellow)" }}>Fiche athlète</p>
          <h2 className="font-display font-semibold text-2xl text-white">{athlete.canonicalName}</h2>
          <p className="text-sm mt-1" style={{ color: "#c7ccd3" }}>{athlete.club || "Club non renseigné"}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-mono text-[10px] uppercase tracking-wide" style={{ color: "#c7ccd3" }}>Sexe :</span>
            {canEdit ? (
              <div className="flex rounded-sm overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.3)" }}>
                {["H", "F"].map((g) => (
                  <button key={g} onClick={() => onSetGender(athlete.id, g)} className="font-mono text-[10px] uppercase px-2 py-1"
                    style={{ background: athlete.gender === g ? "var(--track)" : "transparent", color: "#fff" }}>{g}</button>
                ))}
              </div>
            ) : (
              <span className="font-mono text-[10px]" style={{ color: "#fff" }}>{athlete.gender || "non renseigné"}</span>
            )}
            {!athlete.gender && <span className="font-mono text-[10px]" style={{ color: "var(--lane-yellow)" }}>à renseigner</span>}
          </div>
        </div>

        <div className="p-5">
          <p className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: "var(--steel)" }}>Records personnels (données saisies)</p>
          {bests.length === 0 ? (
            <p className="text-sm mb-4" style={{ color: "var(--steel)" }}>Aucun résultat enregistré pour le moment.</p>
          ) : (
            <div className="space-y-1 mb-4">
              {bests.map((b) => {
                const disc = DISCIPLINES.find((d) => d.id === b.disciplineId);
                const key = `${b.disciplineId}-${b.gender}`;
                const active = historyFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setHistoryFilter(active ? null : key)}
                    className="focus-ring w-full flex items-center justify-between text-sm py-1 px-2 -mx-2 rounded-sm"
                    style={{ background: active ? "var(--paper)" : "transparent" }}
                  >
                    <span style={{ color: active ? "var(--track)" : "var(--ink)" }}>{disc ? getLabel(disc, b.gender) : b.disciplineId} <span style={{ color: "var(--steel)" }}>· {b.gender}</span></span>
                    <span className="font-mono font-semibold" style={{ color: "var(--ink)" }}>{formatMark(disc, b.mark)}</span>
                  </button>
                );
              })}
            </div>
          )}

          {canEdit && (
            <AddPerformancePanel athlete={athlete} competitions={competitions} onAddPerformance={onAddPerformance} />
          )}
        </div>

        <div className="px-5 pb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--steel)" }}>Historique des résultats</p>
            {historyFilter && (
              <button onClick={() => setHistoryFilter(null)} className="focus-ring flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm" style={{ background: "var(--track)", color: "#fff" }}>
                <Filter size={10} /> Filtré <X size={10} />
              </button>
            )}
          </div>
          <div className="space-y-1">
            {visibleHistory.map((h, i) => {
              const disc = DISCIPLINES.find((d) => d.id === h.disciplineId);
              return (
                <div key={i} className="flex items-center gap-1" style={{ borderBottom: i !== visibleHistory.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <button onClick={() => onOpenCompetition(h.compId, h.disciplineId, h.gender, h.round)}
                    className="focus-ring flex-1 min-w-0 flex items-start justify-between text-sm py-2.5 text-left">
                    <div className="min-w-0">
                      <p style={{ color: "var(--track)" }}>{h.compName}</p>
                      <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--steel)" }}>
                        <Calendar size={11} />{new Date(h.date).toLocaleDateString("fr-FR")} · {disc ? getLabel(disc, h.gender) : h.disciplineId} · {roundLabel(h.round)} · {h.place}e place
                      </p>
                    </div>
                    <span className="font-mono font-semibold shrink-0 ml-2" style={{ color: "var(--ink)" }}>{formatMark(disc, h.mark)}</span>
                  </button>
                  {isAdmin && (
                    <button onClick={() => handleDelete(h)} aria-label="Supprimer cette performance" className="focus-ring p-1.5 rounded-sm shrink-0" style={{ color: "var(--steel)" }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
            {visibleHistory.length === 0 && <p className="text-sm" style={{ color: "var(--steel)" }}>Aucun historique.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
