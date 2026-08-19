import React, { useEffect, useMemo, useState } from "react";
import { BarChart2, Calendar, ChevronLeft, ChevronRight, Info, Trophy, Wind } from "lucide-react";
import { DISCIPLINES, getLabel } from "../data/disciplines";
import { computeGlobalRanking } from "../lib/ranking";
import { isLegalWind } from "../lib/marks";
import DisciplineChips from "./DisciplineChips";
import EnvironmentToggle from "./EnvironmentToggle";
import Podium from "./Podium";
import MarkScale from "./MarkScale";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function headline(discipline) {
  if (discipline.type === "time") return "Qui court le plus vite en France\u00a0?";
  if (discipline.type === "distance") return "Qui va le plus loin en France\u00a0?";
  return "Qui totalise le plus de points en France\u00a0?";
}
function markWord(discipline) {
  if (discipline.type === "time") return "Meilleur temps";
  if (discipline.type === "distance") return "Meilleure distance";
  return "Meilleur total";
}

export default function ClassementPage({
  gender, disciplineId, environment, onSetGender, onSetDiscipline, onSetEnvironment,
  resultsStore, athletes, competitions, onSelectAthlete, onGoCalendar,
}) {
  const discipline = DISCIPLINES.find((d) => d.id === disciplineId);
  const effectiveEnv = discipline.indoorEligible ? environment : "outdoor";

  const fullRanking = useMemo(
    () => computeGlobalRanking(discipline, gender, effectiveEnv, resultsStore, athletes, competitions),
    [disciplineId, gender, effectiveEnv, resultsStore, athletes, competitions]
  );
  const leader = fullRanking[0] || null;

  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [showScale, setShowScale] = useState(false);
  useEffect(() => { setPage(1); }, [disciplineId, gender, effectiveEnv, pageSize]);

  const effectivePageSize = pageSize === "all" ? Math.max(fullRanking.length, 1) : pageSize;
  const totalPages = Math.max(1, Math.ceil(fullRanking.length / effectivePageSize));
  const ranking = fullRanking.slice((page - 1) * effectivePageSize, page * effectivePageSize);

  const hasDataFor = (d) => Object.values(resultsStore).some((blocks) => (blocks || []).some((b) => b.disciplineId === d.id && b.gender === gender));

  return (
    <>
      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 pt-10 pb-8 grid md:grid-cols-3 gap-8 items-end">
        <div className="md:col-span-2">
          <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: "var(--track)" }}>Classement national · athlétisme</p>
          <h1 className="font-display font-semibold leading-none mb-4" style={{ color: "var(--ink)", fontSize: "clamp(2rem, 4.5vw, 3.2rem)" }}>{headline(discipline)}</h1>
          <p className="max-w-md" style={{ color: "var(--steel)" }}>Classement calculé à partir des résultats saisis dans le Calendrier. Sélectionnez une discipline et un sexe, puis ouvrez une fiche pour le détail.</p>
        </div>
        <div className="rounded-md p-5" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
          <p className="font-mono text-xs uppercase tracking-wider mb-2" style={{ color: "var(--steel)" }}>{markWord(discipline)} · {getLabel(discipline, gender)} {gender === "H" ? "Hommes" : "Femmes"}{discipline.indoorEligible ? (effectiveEnv === "indoor" ? " · Salle" : " · Plein air") : ""}</p>
          {leader ? (
            <>
              <p className="font-mono font-bold" style={{ color: "var(--ink)", fontSize: "2.6rem", lineHeight: 1 }}>
                {leader.markLabel}
                {discipline.hasWind && leader.wind !== null && leader.wind !== undefined && (
                  <span className="font-mono text-base ml-2" style={{ color: isLegalWind(leader.wind) ? "var(--steel)" : "var(--track)" }}>
                    ({leader.wind > 0 ? "+" : ""}{leader.wind.toFixed(1)}{!isLegalWind(leader.wind) ? " NH" : ""})
                  </span>
                )}
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--ink)" }}>{leader.name} <span style={{ color: "var(--steel)" }}>· {leader.club}</span></p>
            </>
          ) : (
            <p className="text-sm mt-2" style={{ color: "var(--steel)" }}>Aucun résultat saisi pour l'instant.</p>
          )}
        </div>
      </section>

      {/* FILTER BAR */}
      <section className="max-w-5xl mx-auto px-6 pb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-sm overflow-hidden" style={{ border: "1px solid var(--ink)" }}>
            {["H", "F"].map((g) => (
              <button key={g} onClick={() => onSetGender(g)} className="focus-ring chip font-display text-sm px-4 py-2"
                style={{ background: gender === g ? "var(--ink)" : "transparent", color: gender === g ? "#fff" : "var(--ink)" }}>{g === "H" ? "Hommes" : "Femmes"}</button>
            ))}
          </div>
          {discipline.indoorEligible && <EnvironmentToggle environment={effectiveEnv} onChange={onSetEnvironment} />}
        </div>
        <DisciplineChips gender={gender} activeId={disciplineId} onSelect={onSetDiscipline} hasDataFor={hasDataFor} />
      </section>

      {/* RANKING BOARD */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        {ranking.length === 0 ? (
          <div className="rounded-md p-6 text-center" style={{ border: "1px dashed var(--line)", background: "var(--card)" }}>
            <p className="text-sm mb-3" style={{ color: "var(--steel)" }}>Aucun résultat saisi pour {getLabel(discipline, gender)} · {gender === "H" ? "Hommes" : "Femmes"}{discipline.indoorEligible ? (effectiveEnv === "indoor" ? " · Salle" : " · Plein air") : ""}.</p>
            <button onClick={onGoCalendar} className="focus-ring font-mono text-xs uppercase tracking-wide px-3 py-2 rounded-sm" style={{ background: "var(--track)", color: "#fff" }}>Aller au calendrier</button>
          </div>
        ) : (
          <>
            {page === 1 && <Podium top3={ranking.slice(0, 3)} onSelectAthlete={onSelectAthlete} />}
            <button onClick={() => setShowScale((v) => !v)} className="focus-ring flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-sm mb-3" style={{ border: "1px solid var(--line)", color: "var(--steel)" }}>
              <BarChart2 size={11} /> {showScale ? "Masquer" : "Afficher"} les écarts visuels
            </button>
            {showScale && (
              <MarkScale
                discipline={discipline}
                title="Écarts entre athlètes"
                points={ranking.map((r) => ({
                  mark: r.mark,
                  info: `${r.name}${r.date ? " · " + new Date(r.date).toLocaleDateString("fr-FR") : ""}${r.location ? " · " + r.location : ""}`,
                }))}
              />
            )}
            {(page === 1 ? ranking.slice(3) : ranking).length > 0 && (
            <div className="rounded-md overflow-hidden" style={{ border: "1px solid var(--line)", background: "var(--card)" }}>
              {(page === 1 ? ranking.slice(3) : ranking).map((a, idx, arr) => {
              const legal = isLegalWind(a.wind);
              return (
                <button key={a.athleteId} onClick={() => onSelectAthlete(a.athleteId)}
                  className="focus-ring row-hover w-full text-left flex items-center gap-4 px-4 py-3 relative"
                  style={{ borderBottom: idx !== arr.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <span className="accent-bar absolute left-0 top-0 bottom-0 w-1 opacity-0" style={{ background: "var(--track)" }} />
                  <div className="font-display font-bold text-sm w-9 h-9 rounded-sm flex items-center justify-center shrink-0"
                    style={{ background: a.rank === 1 ? "var(--lane-yellow)" : "var(--paper)", color: "var(--ink)", border: "2px solid var(--ink)" }}>{a.rank}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm" style={{ color: "var(--ink)" }}>{a.name}</span>
                      {a.rank === 1 && (<Trophy size={13} style={{ color: "var(--track)" }} />)}
                    </div>
                    <p className="text-xs truncate" style={{ color: "var(--steel)" }}>{a.club} · {a.compName}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs shrink-0" style={{ color: "var(--steel)" }}>
                    {a.date && <span className="flex items-center gap-1"><Calendar size={12} />{new Date(a.date).toLocaleDateString("fr-FR")}</span>}
                    {discipline.hasWind && a.wind !== null && a.wind !== undefined && (
                      <span className="flex items-center gap-1" style={{ color: legal ? "var(--steel)" : "var(--track)" }}>
                        <Wind size={12} />{a.wind > 0 ? `+${a.wind.toFixed(1)}` : a.wind.toFixed(1)}{!legal ? " NH" : ""}
                      </span>
                    )}
                  </div>
                  <div className="font-mono font-semibold text-lg shrink-0" style={{ color: "var(--ink)" }}>{a.markLabel}</div>
                </button>
              );
            })}
            </div>
            )}
          </>
        )}

        {fullRanking.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <div className="flex items-center gap-2 font-mono text-xs" style={{ color: "var(--steel)" }}>
              <span>Par page :</span>
              <select
                className="field"
                style={{ width: "auto" }}
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))}
              >
                {PAGE_SIZE_OPTIONS.map((n) => (<option key={n} value={n}>{n}</option>))}
                <option value="all">Tous ({fullRanking.length})</option>
              </select>
            </div>
            {pageSize !== "all" && totalPages > 1 && (
              <div className="flex items-center gap-3 font-mono text-xs" style={{ color: "var(--steel)" }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="focus-ring flex items-center gap-1 px-2 py-1 rounded-sm disabled:opacity-40"
                  style={{ border: "1px solid var(--line)" }}
                ><ChevronLeft size={13} /> Précédent</button>
                <span>Page {page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="focus-ring flex items-center gap-1 px-2 py-1 rounded-sm disabled:opacity-40"
                  style={{ border: "1px solid var(--line)" }}
                >Suivant <ChevronRight size={13} /></button>
              </div>
            )}
          </div>
        )}

        <p className="font-mono text-xs mt-4 flex items-center gap-2" style={{ color: "var(--steel)" }}><Info size={13} /> Meilleure marque de chaque athlète, toutes compétitions et tours confondus. "NH" = vent supérieur à +2.0 m/s, non homologable.</p>
      </section>
    </>
  );
}
