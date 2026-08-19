import React, { useMemo, useState } from "react";
import { X, Calendar, Trash2, Filter, Maximize2, Minimize2 } from "lucide-react";
import { DISCIPLINES, getLabel } from "../data/disciplines";
import { formatMark, isBetterMark, isLegalWind, compareMarks, markDisplay } from "../lib/marks";
import { compareEntries } from "../lib/blocks";
import { roundLabel, envLabel } from "../lib/rounds";
import { getAthleteHistory } from "../lib/ranking";
import { useAuth } from "../lib/auth";
import AddPerformancePanel from "./AddPerformancePanel";
import MarkScale from "./MarkScale";

export default function AthleteProfilePanel({ athleteId, athletes, resultsStore, competitions, onClose, onOpenCompetition, onAddPerformance, onSetGender, onDeletePerformance }) {
  const { canEdit, isAdmin } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const athlete = athletes.find((a) => a.id === athleteId);
  const [historyFilter, setHistoryFilter] = useState(null); // `${disciplineId}-${gender}-${environment}` ou null
  const [sortMode, setSortMode] = useState("date_desc");
  const history = useMemo(() => getAthleteHistory(athleteId, resultsStore, competitions), [athleteId, resultsStore, competitions]);
  const bests = useMemo(() => {
    const map = {};
    history.forEach((h) => {
      const disc = DISCIPLINES.find((d) => d.id === h.disciplineId);
      if (!disc) return;
      const key = `${h.disciplineId}-${h.gender}-${h.environment}`;
      if (h.status) return; // DNS/DNF/DQ : pas de marque à comparer
      if (!map[key] || isBetterMark(disc, h.mark, map[key].mark)) map[key] = h;
    });
    return Object.values(map).sort((a, b) => a.disciplineId.localeCompare(b.disciplineId));
  }, [history]);
  const visibleHistoryRaw = historyFilter ? history.filter((h) => `${h.disciplineId}-${h.gender}-${h.environment}` === historyFilter) : history;
  const visibleDiscipline = visibleHistoryRaw[0] ? DISCIPLINES.find((d) => d.id === visibleHistoryRaw[0].disciplineId) : null;
  const visibleHistory = useMemo(() => {
    const arr = [...visibleHistoryRaw];
    if (sortMode === "date_asc") arr.sort((a, b) => new Date(a.date) - new Date(b.date));
    else if (sortMode === "date_desc") arr.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (sortMode === "mark_best" && visibleDiscipline) arr.sort((a, b) => compareEntries(visibleDiscipline, a, b));
    else if (sortMode === "mark_worst" && visibleDiscipline) arr.sort((a, b) => compareEntries(visibleDiscipline, b, a));
    return arr;
  }, [visibleHistoryRaw, sortMode, visibleDiscipline]);

  if (!athlete) return null;

  function handleDelete(h) {
    if (!window.confirm(`Supprimer cette performance (${h.compName}) ? Cette action est irréversible (mais restaurable par un admin depuis la corbeille).`)) return;
    onDeletePerformance(h.compId, h.disciplineId, h.gender, h.environment, h.round);
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0" style={{ background: "rgba(20,23,31,0.5)" }} onClick={onClose} />
      <div className={"relative h-full overflow-y-auto " + (expanded ? "w-full" : "w-full sm:w-96")} style={{ background: "var(--card)" }}>
        <div className="p-5" style={{ background: "var(--ink)" }}>
          <button onClick={onClose} aria-label="Fermer la fiche athlète" className="focus-ring float-right p-1 rounded-sm ml-2" style={{ color: "#fff" }}><X size={20} /></button>
          <button onClick={() => setExpanded((v) => !v)} aria-label={expanded ? "Réduire" : "Agrandir en pleine page"} className="focus-ring float-right p-1 rounded-sm hidden sm:block" style={{ color: "#fff" }}>
            {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
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

        <div className={"p-5" + (expanded ? " max-w-2xl mx-auto" : "")}>
          <p className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: "var(--steel)" }}>Records personnels (données saisies)</p>
          {bests.length === 0 ? (
            <p className="text-sm mb-4" style={{ color: "var(--steel)" }}>Aucun résultat enregistré pour le moment.</p>
          ) : (
            <div className="space-y-1 mb-4">
              {bests.map((b) => {
                const disc = DISCIPLINES.find((d) => d.id === b.disciplineId);
                const key = `${b.disciplineId}-${b.gender}-${b.environment}`;
                const active = historyFilter === key;
                const legal = isLegalWind(b.wind);
                return (
                  <button
                    key={key}
                    onClick={() => setHistoryFilter(active ? null : key)}
                    className="focus-ring w-full text-left py-1.5 px-2 -mx-2 rounded-sm"
                    style={{ background: active ? "var(--paper)" : "transparent" }}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: active ? "var(--track)" : "var(--ink)" }}>
                        {disc ? getLabel(disc, b.gender) : b.disciplineId} <span style={{ color: "var(--steel)" }}>· {b.gender}{disc && disc.indoorEligible && b.environment === "indoor" ? " · Salle" : ""}</span>
                      </span>
                      <span className="font-mono font-semibold" style={{ color: "var(--ink)" }}>
                        {formatMark(disc, b.mark)}
                        {disc && disc.hasWind && b.wind !== null && b.wind !== undefined && (
                          <span className="font-mono text-xs ml-1" style={{ color: legal ? "var(--steel)" : "var(--track)" }}>({b.wind > 0 ? "+" : ""}{b.wind.toFixed(1)}{!legal ? " NH" : ""})</span>
                        )}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--steel)" }}>{b.date ? new Date(b.date).toLocaleDateString("fr-FR") : ""}{b.date && b.compName ? " · " : ""}{b.compName}</p>
                  </button>
                );
              })}
            </div>
          )}

          {canEdit && (
            <AddPerformancePanel athlete={athlete} competitions={competitions} onAddPerformance={onAddPerformance} />
          )}
        </div>

        <div className={"px-5 pb-8" + (expanded ? " max-w-2xl mx-auto" : "")}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--steel)" }}>Historique des résultats</p>
            <div className="flex items-center gap-2">
              <select className="field" style={{ width: "auto" }} value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
                <option value="date_desc">Plus récent d'abord</option>
                <option value="date_asc">Plus ancien d'abord</option>
                {visibleDiscipline && <option value="mark_best">Meilleure marque d'abord</option>}
                {visibleDiscipline && <option value="mark_worst">Moins bonne marque d'abord</option>}
              </select>
              {historyFilter && (
                <button onClick={() => setHistoryFilter(null)} className="focus-ring flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm" style={{ background: "var(--track)", color: "#fff" }}>
                  <Filter size={10} /> Filtré <X size={10} />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1">
            {historyFilter && visibleHistory.filter((h) => !h.status).length > 1 && (
              <MarkScale
                discipline={visibleDiscipline}
                points={visibleHistory.filter((h) => !h.status).map((h) => ({ mark: h.mark, info: new Date(h.date).toLocaleDateString("fr-FR") }))}
              />
            )}
            {visibleHistory.map((h, i) => {
              const disc = DISCIPLINES.find((d) => d.id === h.disciplineId);
              return (
                <div key={i} className="flex items-center gap-1" style={{ borderBottom: i !== visibleHistory.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <button onClick={() => onOpenCompetition(h.compId, h.disciplineId, h.gender, h.round, h.environment)}
                    className="focus-ring flex-1 min-w-0 flex items-start justify-between text-sm py-2.5 text-left">
                    <div className="min-w-0">
                      <p style={{ color: "var(--track)" }}>{h.compName}</p>
                      <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--steel)" }}>
                        <Calendar size={11} />{new Date(h.date).toLocaleDateString("fr-FR")} · {disc ? getLabel(disc, h.gender) : h.disciplineId}{disc && disc.indoorEligible ? ` · ${envLabel(h.environment)}` : ""} · {roundLabel(h.round)} · {h.place}e place
                      </p>
                    </div>
                    <span className="font-mono font-semibold shrink-0 ml-2" style={{ color: h.status ? "var(--track)" : "var(--ink)" }}>{markDisplay(disc, h)}</span>
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
