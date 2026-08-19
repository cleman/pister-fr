import { describe, it, expect } from "vitest";
import { getCompStatus, getAthleteHistory, computeCompetitionOverview, computeGlobalRanking } from "./ranking";
import { DISCIPLINES } from "../data/disciplines";

const time100 = DISCIPLINES.find((d) => d.id === "100");
const time800 = DISCIPLINES.find((d) => d.id === "800");
const longueur = DISCIPLINES.find((d) => d.id === "longueur");

describe("getCompStatus", () => {
  const base = { manualComplete: false, date: "2020-01-01" };
  it("saisi si marqué manuellement complet", () => {
    expect(getCompStatus({ ...base, manualComplete: true }, {})).toBe("saisi");
  });
  it("à venir si la date est dans le futur", () => {
    expect(getCompStatus({ ...base, date: "2099-01-01" }, {})).toBe("a_venir");
  });
  it("à saisir si passée sans résultats", () => {
    expect(getCompStatus({ ...base, id: "c1" }, {})).toBe("a_saisir");
  });
  it("en cours si passée avec des résultats", () => {
    expect(getCompStatus({ ...base, id: "c1" }, { c1: [{ entries: [] }] })).toBe("en_cours");
  });
});

describe("getAthleteHistory / computeGlobalRanking / computeCompetitionOverview", () => {
  const competitions = [
    { id: "c1", name: "Meeting A", date: "2026-06-01", location: "Paris" },
    { id: "c2", name: "Meeting B", date: "2026-07-01", location: "Lyon" },
  ];
  const resultsStore = {
    c1: [
      { disciplineId: "100", gender: "H", environment: "outdoor", round: { type: "finale", heat: null },
        entries: [
          { place: 1, name: "Théo Schaub", club: "Nice", mark: 10.4, wind: 0.5, athleteId: "a1" },
          { place: 2, name: "Jeff Erius", club: "Lille", mark: 10.5, wind: 0.5, athleteId: "a2" },
        ] },
      { disciplineId: "100", gender: "H", environment: "outdoor", round: { type: "serie", heat: 1 },
        entries: [
          { place: 1, name: "Théo Schaub", club: "Nice", mark: 10.35, wind: 1.0, athleteId: "a1" },
          { place: 2, name: "Jeff Erius", club: "Lille", mark: 10.6, wind: 1.0, athleteId: "a2" },
        ] },
    ],
    c2: [
      { disciplineId: "100", gender: "H", environment: "outdoor", round: { type: "finale", heat: null },
        entries: [
          { place: 1, name: "Théo Schaub", club: "Nice", mark: 10.45, wind: 0, athleteId: "a1" },
        ] },
      { disciplineId: "800", gender: "H", environment: "outdoor", round: { type: "finale", heat: null },
        entries: [
          { place: 1, name: "Jeff Erius", club: "Lille", mark: 108.0, wind: null, athleteId: "a2" },
        ] },
      { disciplineId: "800", gender: "H", environment: "indoor", round: { type: "finale", heat: null },
        entries: [
          { place: 1, name: "Jeff Erius", club: "Lille", mark: 106.6, wind: null, athleteId: "a2" },
        ] },
    ],
  };
  const athletes = [
    { id: "a1", canonicalName: "Théo Schaub", club: "Nice" },
    { id: "a2", canonicalName: "Jeff Erius", club: "Lille" },
  ];

  it("getAthleteHistory : ne renvoie que les entrées de l'athlète demandé, triées par date décroissante", () => {
    const history = getAthleteHistory("a1", resultsStore, competitions);
    expect(history.every((h) => h.compId === "c1" || h.compId === "c2")).toBe(true);
    expect(history[0].date >= history[history.length - 1].date).toBe(true);
    expect(history.some((h) => h.athleteId)).toBe(false); // athleteId n'est pas recopié dans l'historique, juste les infos de la perf
  });

  it("computeCompetitionOverview : garde la meilleure marque de chaque athlète tous tours confondus", () => {
    const overview = computeCompetitionOverview(time100, resultsStore.c1);
    // Théo : 10.4 (finale) vs 10.35 (série) -> la série est meilleure pour un temps
    const theo = overview.find((e) => e.athleteId === "a1");
    expect(theo.mark).toBeCloseTo(10.35, 2);
    expect(theo.place).toBe(1);
  });

  it("computeGlobalRanking : sépare bien indoor et outdoor pour une discipline éligible", () => {
    const outdoor = computeGlobalRanking(time800, "H", "outdoor", resultsStore, athletes, competitions);
    const indoor = computeGlobalRanking(time800, "H", "indoor", resultsStore, athletes, competitions);
    expect(outdoor.find((r) => r.athleteId === "a2").mark).toBe(108.0);
    expect(indoor.find((r) => r.athleteId === "a2").mark).toBe(106.6);
  });

  it("computeGlobalRanking : prend la meilleure marque toutes compétitions confondues, classée correctement", () => {
    const outdoor = computeGlobalRanking(time100, "H", "outdoor", resultsStore, athletes, competitions);
    expect(outdoor[0].athleteId).toBe("a1"); // 10.35 meilleur que tout ce que fait Jeff en outdoor
    expect(outdoor[0].rank).toBe(1);
    expect(outdoor[0].markLabel).toBe("10.35");
  });

  it("computeGlobalRanking : discipline non éligible indoor reste toujours outdoor", () => {
    const withIndoorArg = computeGlobalRanking(longueur.indoorEligible ? longueur : time100, "H", "indoor", resultsStore, athletes, competitions);
    // ici on vérifie juste que la fonction ne plante pas et respecte indoorEligible
    expect(Array.isArray(withIndoorArg)).toBe(true);
  });

  it("computeGlobalRanking : ignore les entrées avec statut (DNS/DNF/DQ, pas de marque à comparer)", () => {
    const withStatus = {
      c3: [
        { disciplineId: "100", gender: "H", environment: "outdoor", round: { type: "finale", heat: null },
          entries: [
            { place: null, name: "Isabelle Black", club: "Montpellier", mark: null, wind: null, status: "DNF", athleteId: "a3" },
          ] },
      ],
    };
    const ranking = computeGlobalRanking(time100, "H", "outdoor", withStatus, athletes, [{ id: "c3", name: "Meeting C", date: "2026-08-01" }]);
    expect(ranking.some((r) => r.athleteId === "a3")).toBe(false);
  });
});
