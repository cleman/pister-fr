import { uid } from "../lib/util";
import { normalizeName } from "../lib/athletes";
import { parseTimeString } from "../lib/time";

/* Résultats réels des Championnats de France Élite 2026 (Albi), trouvés par
   recherche web au fil de la conversation — sert de données de démarrage. */
export const DEFAULT_RESULTS_RAW = {
  albi2026: [
    { disciplineId: "100", gender: "H", round: { type: "finale", heat: null }, entries: [
      { name: "Théo Schaub", club: "Nice Côte d'Azur Athlé", time: "10.38" },
      { name: "Jeff Erius", club: "Lille Métropole Athlé", time: "10.40" },
      { name: "Antoine Thoraval", club: "—", time: "10.40" },
    ]},
    { disciplineId: "100", gender: "F", round: { type: "finale", heat: null }, entries: [
      { name: "Gémima Joseph", club: "—", time: "11.26" },
      { name: "Sarah Richard-Mingas", club: "—", time: "11.70" },
      { name: "Grace Tade", club: "—", time: "11.70" },
    ]},
    { disciplineId: "800", gender: "H", round: { type: "finale", heat: null }, entries: [
      { name: "Louey Ouerrat", club: "Athletic Vosges EC", time: "1:44.91" },
      { name: "Gabriel Tual", club: "US Talence", time: "1:45.07" },
      { name: "Yanis Meziane", club: "Athlé 91", time: "1:45.12" },
    ]},
    { disciplineId: "400", gender: "F", round: { type: "finale", heat: null }, entries: [
      { name: "Isabelle Black", club: "Montpellier Athlé", time: "50.58" },
      { name: "Amandine Brossier", club: "—", time: "52.14" },
      { name: "Benedetta Kouakou", club: "—", time: "52.14" },
    ]},
    { disciplineId: "haies-courtes", gender: "F", round: { type: "finale", heat: null }, entries: [
      { name: "Sacha Alessandrini", club: "Nice", time: "12.81" },
      { name: "Laëticia Bapte", club: "—", time: "12.84" },
      { name: "Melissa Benfatah", club: "—", time: "13.28" },
    ]},
    { disciplineId: "1500", gender: "F", round: { type: "finale", heat: null }, entries: [
      { name: "Agathe Guillemot", club: "Haute Bretagne Athlé", time: "4:23.05" },
      { name: "Adèle Gay", club: "—", time: "4:23.59" },
      { name: "Bérénice Cleyet-Merle", club: "—", time: "4:24.05" },
    ]},
    { disciplineId: "3000sc", gender: "H", round: { type: "finale", heat: null }, entries: [
      { name: "Alexis Miellet", club: "Dijon UC", time: "8:24.63" },
      { name: "Pierre Boudy", club: "Free Run Athlé 37", time: "8:24.99" },
      { name: "Oscar Thébaud", club: "Ouest Vendée", time: "8:25.43" },
    ]},
    { disciplineId: "5000", gender: "F", round: { type: "finale", heat: null }, entries: [
      { name: "Anaelle Guillonnet", club: "—", time: "15:46.60" },
      { name: "Philippine De la Bigne", club: "—", time: "15:47.54" },
      { name: "Julia David-Smith", club: "—", time: "15:48.65" },
    ]},
  ],
};

export function buildDefaultSeed() {
  const athletesMap = {};
  const results = {};
  Object.entries(DEFAULT_RESULTS_RAW).forEach(([compId, blocks]) => {
    results[compId] = blocks.map((block) => ({
      disciplineId: block.disciplineId,
      gender: block.gender,
      round: block.round,
      entries: block.entries.map((e, i) => {
        const key = normalizeName(e.name);
        if (!athletesMap[key]) athletesMap[key] = { id: uid(), canonicalName: e.name, club: e.club };
        return { place: i + 1, name: e.name, club: e.club, timeSeconds: parseTimeString(e.time), wind: null, athleteId: athletesMap[key].id };
      }),
    }));
  });
  return { athletes: Object.values(athletesMap), results };
}
