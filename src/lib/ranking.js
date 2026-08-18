import { formatTime } from "./time";

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
            place: e.place, timeSeconds: e.timeSeconds, wind: e.wind, club: e.club,
          });
        }
      });
    });
  });
  rows.sort((a, b) => new Date(b.date) - new Date(a.date));
  return rows;
}

/* classement global (toutes compétitions et tours confondus) à partir des
   vraies données saisies : meilleure marque de chaque athlète pour une
   discipline + sexe donnés */
export function computeGlobalRanking(disciplineId, gender, resultsStore, athletes, competitions) {
  const bestByAthlete = {};
  Object.entries(resultsStore).forEach(([compId, blocks]) => {
    (blocks || []).forEach((block) => {
      if (block.disciplineId !== disciplineId || block.gender !== gender) return;
      block.entries.forEach((e) => {
        const cur = bestByAthlete[e.athleteId];
        if (!cur || e.timeSeconds < cur.timeSeconds) {
          const comp = competitions.find((c) => c.id === compId);
          bestByAthlete[e.athleteId] = {
            athleteId: e.athleteId,
            timeSeconds: e.timeSeconds,
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
    .sort((a, b) => a.timeSeconds - b.timeSeconds)
    .map((r, i) => ({ ...r, rank: i + 1, timeLabel: formatTime(disciplineId, r.timeSeconds) }));
}
