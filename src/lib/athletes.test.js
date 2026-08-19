import { describe, it, expect } from "vitest";
import { normalizeName, tokenKey, levenshtein, findAthleteMatches, resolveAthlete, resolveBlockEntries } from "./athletes";

describe("normalizeName", () => {
  it("supprime les accents et met en minuscules", () => {
    expect(normalizeName("Théo Schaub")).toBe("theo schaub");
  });
  it("supprime la ponctuation mais garde les tirets", () => {
    expect(normalizeName("O'Brien-Smith")).toBe("obrien-smith");
  });
  it("réduit les espaces multiples", () => {
    expect(normalizeName("Jean   Dupont")).toBe("jean dupont");
  });
});

describe("tokenKey", () => {
  it("même clé quel que soit l'ordre nom/prénom", () => {
    expect(tokenKey("Schaub Theo")).toBe(tokenKey("Theo Schaub"));
  });
  it("distingue des noms réellement différents", () => {
    expect(tokenKey("Theo Schaub")).not.toBe(tokenKey("Theo Marchand"));
  });
});

describe("levenshtein", () => {
  it("0 pour deux chaînes identiques", () => {
    expect(levenshtein("schaub", "schaub")).toBe(0);
  });
  it("cas classique kitten/sitting = 3", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
  });
});

describe("findAthleteMatches", () => {
  const registry = [
    { id: "1", canonicalName: "Théo Schaub", club: "Nice" },
    { id: "2", canonicalName: "Jeff Erius", club: "Lille" },
  ];
  it("trouve malgré une faute de frappe légère", () => {
    const matches = findAthleteMatches("Théo Schaub", registry, 4);
    expect(matches[0].id).toBe("1");
  });
  it("trouve malgré un ordre nom/prénom inversé", () => {
    const matches = findAthleteMatches("Schaub Theo", registry, 4);
    expect(matches.some((m) => m.id === "1")).toBe(true);
  });
  it("ne trouve rien pour un nom totalement différent", () => {
    const matches = findAthleteMatches("Isabelle Black", registry, 4);
    expect(matches).toHaveLength(0);
  });
});

describe("resolveAthlete", () => {
  const registry = [{ id: "1", canonicalName: "Théo Schaub", club: "Nice" }];
  it("réutilise l'id existant pour une correspondance proche", () => {
    const r = resolveAthlete("theo schaub", "Nice", registry);
    expect(r.id).toBe("1");
    expect(r.isNew).toBe(false);
  });
  it("crée un nouvel athlète pour un nom vraiment différent", () => {
    const r = resolveAthlete("Isabelle Black", "Montpellier", registry);
    expect(r.isNew).toBe(true);
    expect(r.id).not.toBe("1");
  });
});

describe("resolveBlockEntries", () => {
  it("assigne un athleteId cohérent et enregistre le sexe si absent", () => {
    const entries = [{ name: "Théo Schaub", club: "Nice" }];
    const { entries: resolved, registry } = resolveBlockEntries(entries, [], "H");
    expect(resolved[0].athleteId).toBeDefined();
    const athlete = registry.find((a) => a.id === resolved[0].athleteId);
    expect(athlete.gender).toBe("H");
  });
  it("ne réécrit pas un sexe déjà connu", () => {
    const registry = [{ id: "1", canonicalName: "Théo Schaub", club: "Nice", gender: "H" }];
    const entries = [{ name: "Theo Schaub", club: "Nice" }];
    const { registry: updated } = resolveBlockEntries(entries, registry, "F");
    expect(updated.find((a) => a.id === "1").gender).toBe("H");
  });
});
