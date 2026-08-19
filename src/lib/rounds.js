const ROUND_ORDER = { finale: 0, demi: 1, serie: 2, overview: -1 };

export function roundKey(round) {
  if (!round) return "none";
  return `${round.type}-${round.heat || 0}`;
}

export function roundLabel(round, forceNumber) {
  if (!round) return "";
  if (round.type === "overview") return "Vue d'ensemble";
  if (round.type === "finale") {
    if (forceNumber || (round.heat && round.heat > 1)) return `Finale ${round.heat || 1}`;
    return "Finale";
  }
  if (round.type === "demi") return `Demi-finale ${round.heat}`;
  return `Série ${round.heat}`;
}

export function compareRounds(a, b) {
  if (ROUND_ORDER[a.type] !== ROUND_ORDER[b.type]) return ROUND_ORDER[a.type] - ROUND_ORDER[b.type];
  return (a.heat || 0) - (b.heat || 0);
}

export function nextHeatNumber(existingRounds, type) {
  const used = existingRounds.filter((r) => r.type === type).map((r) => r.heat || 0);
  let n = 1;
  while (used.includes(n)) n++;
  return n;
}

export function defaultRound(blocksForFilter) {
  if (!blocksForFilter.length) return null;
  const finale = [...blocksForFilter].sort((a, b) => compareRounds(a.round, b.round)).find((b) => b.round.type === "finale");
  return (finale || blocksForFilter[0]).round;
}

/* Indoor / plein air — un bloc de résultats a un environnement (par défaut
   "outdoor" pour les données existantes, créées avant cette notion). */
export function envLabel(env) {
  return env === "indoor" ? "Salle (indoor)" : "Plein air";
}

/* Clé identifiant un bloc de façon unique : discipline + sexe + environnement
   + tour. Utilisée partout où l'on doit retrouver/comparer des blocs. */
export function blockKey(disciplineId, gender, environment, round) {
  return `${disciplineId}|${gender}|${environment || "outdoor"}|${roundKey(round)}`;
}

/* Pseudo-tour calculé automatiquement (jamais stocké) : combine finale(s),
   demi-finale(s) et série(s) d'une même discipline/sexe/environnement pour
   donner une vue d'ensemble — la meilleure marque de chaque athlète, tous
   tours confondus, au sein d'UNE SEULE compétition. */
export const OVERVIEW_ROUND = { type: "overview", heat: null };
