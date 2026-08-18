import React, { useMemo } from "react";
import { X, Calendar } from "lucide-react";
import { DISCIPLINES, getLabel } from "../data/disciplines";
import { formatTime } from "../lib/time";
import { roundLabel } from "../lib/rounds";
import { getAthleteHistory } from "../lib/ranking";

export default function AthleteProfilePanel({ athleteId, athletes, resultsStore, competitions, onClose, onOpenCompetition }) {
  const athlete = athletes.find((a) => a.id === athleteId);
  const history = useMemo(() => getAthleteHistory(athleteId, resultsStore, competitions), [athleteId, resultsStore, competitions]);
  const bests = useMemo(() => {
    const map = {};
    history.forEach((h) => {
      const key = `${h.disciplineId}-${h.gender}`;
      if (!map[key] || h.timeSeconds < map[key].timeSeconds) map[key] = h;
    });
    return Object.values(map).sort((a, b) => a.disciplineId.localeCompare(b.disciplineId));
  }, [history]);

  if (!athlete) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0" style={{ background: "rgba(20,23,31,0.5)" }} onClick={onClose} />
      <div className="relative w-full sm:w-96 h-full overflow-y-auto" style={{ background: "var(--card)" }}>
        <div className="p-5" style={{ background: "var(--ink)" }}>
          <button onClick={onClose} aria-label="Fermer la fiche athlète" className="focus-ring float-right p-1 rounded-sm" style={{ color: "#fff" }}><X size={20} /></button>
          <p className="font-mono text-xs uppercase tracking-wider mb-1" style={{ color: "var(--lane-yellow)" }}>Fiche athlète</p>
          <h2 className="font-display font-semibold text-2xl text-white">{athlete.canonicalName}</h2>
          <p className="text-sm mt-1" style={{ color: "#c7ccd3" }}>{athlete.club || "Club non renseigné"}</p>
        </div>

        <div className="p-5">
          <p className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: "var(--steel)" }}>Records personnels (données saisies)</p>
          {bests.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--steel)" }}>Aucun résultat enregistré pour le moment.</p>
          ) : (
            <div className="space-y-2 mb-2">
              {bests.map((b) => {
                const disc = DISCIPLINES.find((d) => d.id === b.disciplineId);
                return (
                  <div key={`${b.disciplineId}-${b.gender}`} className="flex items-center justify-between text-sm">
                    <span style={{ color: "var(--ink)" }}>{disc ? getLabel(disc, b.gender) : b.disciplineId} <span style={{ color: "var(--steel)" }}>· {b.gender}</span></span>
                    <span className="font-mono font-semibold" style={{ color: "var(--ink)" }}>{formatTime(b.disciplineId, b.timeSeconds)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 pb-8">
          <p className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: "var(--steel)" }}>Historique des résultats</p>
          <div className="space-y-1">
            {history.map((h, i) => {
              const disc = DISCIPLINES.find((d) => d.id === h.disciplineId);
              return (
                <button key={i} onClick={() => onOpenCompetition(h.compId, h.disciplineId, h.gender, h.round)}
                  className="focus-ring w-full flex items-start justify-between text-sm py-2.5 text-left"
                  style={{ borderBottom: i !== history.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <div>
                    <p style={{ color: "var(--track)" }}>{h.compName}</p>
                    <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--steel)" }}>
                      <Calendar size={11} />{new Date(h.date).toLocaleDateString("fr-FR")} · {disc ? getLabel(disc, h.gender) : h.disciplineId} · {roundLabel(h.round)} · {h.place}e place
                    </p>
                  </div>
                  <span className="font-mono font-semibold" style={{ color: "var(--ink)" }}>{formatTime(h.disciplineId, h.timeSeconds)}</span>
                </button>
              );
            })}
            {history.length === 0 && <p className="text-sm" style={{ color: "var(--steel)" }}>Aucun historique.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
