import { formatMark, compareMarks, isBetterMark } from "./marks";

export const TODAY = new Date();

export function getCompStatus(comp, resultsStore) {
  if (comp.manualComplete) return "saisi";
  const isFuture = new Date(comp.date) > TODAY;
  if (isFuture) return "a_venir";
  const hasResults = (resultsStore[comp.id] || []).length > 0;
  return hasResults ? "en_cours" : "a_saisir";
}

export function getAthleteHistory(athleteId, resultsStore, competitions) {
  const rows = [];
  Object.entries(resultsStore).forEach(([compId, blocks]) => {
    const comp = competitions.find((c) => c.id === compId);
    if (!comp) return;
    (blocks || []).forEach((block) => {
      block.entries.forEach((e) => {
        if (e.athleteId === athleteId) {
          rows.push({
            compId, compName: comp.name, date: comp.date,
            disciplineId: block.disciplineId, gender: block.gender, round: block.round,
            environment: block.environment || "outdoor",
            place: e.place, mark: e.mark, wind: e.wind, club: e.club,
          });
        }
      });
    });
  });
  rows.sort((a, b) => new Date(b.date) - new Date(a.date));
  return rows;
}

/* Vue d'ensemble d'UNE compétition : combine tous les tours (séries, demi-
   finales, finale(s)) d'une même discipline/sexe/environnement — la
   meilleure marque de chaque athlète, tous tours confondus. Calculée à la
   volée, jamais stockée. */
export function computeCompetitionOverview(discipline, blocksForFilter) {
  const bestByAthlete = {};
  blocksForFilter.forEach((block) => {
    block.entries.forEach((e) => {
      const cur = bestByAthlete[e.athleteId];
      if (!cur || isBetterMark(discipline, e.mark, cur.mark)) {
        bestByAthlete[e.athleteId] = { ...e };
      }
    });
  });
  return Object.values(bestByAthlete)
    .sort((a, b) => compareMarks(discipline, a.mark, b.mark))
    .map((e, i) => ({ ...e, place: i + 1 }));
}

/* classement global (toutes compétitions et tours confondus) à partir des
   vraies données saisies : meilleure marque de chaque athlète pour une
   discipline + sexe + environnement donnés. `discipline` est l'objet
   complet (pas juste l'id) car le sens de "meilleur" dépend de son type.
   `environment` ('outdoor'|'indoor') ne s'applique que si la discipline
   est éligible à l'indoor ; sinon toutes les données sont considérées
   plein air. */
export function computeGlobalRanking(discipline, gender, environment, resultsStore, athletes, competitions) {
  const env = discipline.indoorEligible ? (environment || "outdoor") : "outdoor";
  const bestByAthlete = {};
  Object.entries(resultsStore).forEach(([compId, blocks]) => {
    (blocks || []).forEach((block) => {
      if (block.disciplineId !== discipline.id || block.gender !== gender) return;
      if ((block.environment || "outdoor") !== env) return;
      block.entries.forEach((e) => {
        const cur = bestByAthlete[e.athleteId];
        if (!cur || isBetterMark(discipline, e.mark, cur.mark)) {
          const comp = competitions.find((c) => c.id === compId);
          bestByAthlete[e.athleteId] = {
            athleteId: e.athleteId,
            mark: e.mark,
            wind: e.wind ?? null,
            club: e.club,
            compId,
            compName: comp ? comp.name : "",
            date: comp ? comp.date : null,
            round: block.round,
          };
        }
      });
    });
  });
  return Object.values(bestByAthlete)
    .map((b) => ({ ...b, name: (athletes.find((a) => a.id === b.athleteId) || {}).canonicalName || "?" }))
    .sort((a, b) => compareMarks(discipline, a.mark, b.mark))
    .map((r, i) => ({ ...r, rank: i + 1, markLabel: formatMark(discipline, r.mark) }));
}
