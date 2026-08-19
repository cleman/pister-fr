import { describe, it, expect } from "vitest";
import { upsertBlockEntry, removeBlockEntry, compareEntries } from "./blocks";
import { DISCIPLINES } from "../data/disciplines";

const hauteur = DISCIPLINES.find((d) => d.id === "hauteur");
const time3000sc = DISCIPLINES.find((d) => d.id === "3000sc");

describe("upsertBlockEntry — respecte une place réellement connue", () => {
  it("exemple réel : 13e place en hauteur, seule dans le bloc — ne doit PAS devenir 1ère", () => {
    const entry = { name: "Athlète Test", club: "Macon", mark: 1.2, wind: null, athleteId: "a1", place: 13 };
    const result = upsertBlockEntry(hauteur, [], entry);
    expect(result).toHaveLength(1);
    expect(result[0].place).toBe(13); // pas 1 !
  });

  it("sans place fournie (comportement historique) : seule dans le bloc -> 1ère", () => {
    const entry = { name: "Athlète Test", club: "Macon", mark: 1.2, wind: null, athleteId: "a1" };
    const result = upsertBlockEntry(hauteur, [], entry);
    expect(result[0].place).toBe(1);
  });

  it("n'écrase pas les places réelles déjà présentes en ajoutant une nouvelle entrée avec place connue", () => {
    const existing = [{ name: "Premier", club: "X", mark: 596.17, athleteId: "a2", place: 6 }];
    const entry = { name: "Athlète Test", club: "Y", mark: 387.56, athleteId: "a1", place: 1 };
    const result = upsertBlockEntry(time3000sc, existing, entry);
    expect(result.find((e) => e.athleteId === "a2").place).toBe(6); // inchangé
    expect(result.find((e) => e.athleteId === "a1").place).toBe(1);
  });

  it("upsert : remplace l'entrée existante du même athlète plutôt que de la dupliquer", () => {
    const existing = [{ name: "Athlète Test", club: "X", mark: 1.15, athleteId: "a1", place: 13 }];
    const entry = { name: "Athlète Test", club: "X", mark: 1.20, athleteId: "a1", place: 10 };
    const result = upsertBlockEntry(hauteur, existing, entry);
    expect(result).toHaveLength(1);
    expect(result[0].mark).toBe(1.2);
    expect(result[0].place).toBe(10);
  });

  it("sans place connue, plusieurs entrées : la meilleure marque prend la 1ère place", () => {
    const existing = [{ name: "A", club: "X", mark: 10.5, athleteId: "a2" }];
    const entry = { name: "B", club: "Y", mark: 10.3, athleteId: "a1" };
    const time100 = DISCIPLINES.find((d) => d.id === "100");
    const result = upsertBlockEntry(time100, existing, entry);
    expect(result.find((e) => e.athleteId === "a1").place).toBe(1);
    expect(result.find((e) => e.athleteId === "a2").place).toBe(2);
  });
});

describe("removeBlockEntry — ne renumérote jamais les places restantes", () => {
  it("garde les places réelles des entrées restantes après suppression", () => {
    const existing = [
      { name: "A", athleteId: "a1", place: 1 },
      { name: "B", athleteId: "a2", place: 6 },
      { name: "C", athleteId: "a3", place: 13 },
    ];
    const result = removeBlockEntry(existing, "a1");
    expect(result).toHaveLength(2);
    expect(result.find((e) => e.athleteId === "a2").place).toBe(6);
    expect(result.find((e) => e.athleteId === "a3").place).toBe(13); // pas renuméroté en 2
  });
});

describe("compareEntries — les statuts (DNS/DNF/DQ) passent après les marques valides", () => {
  const time100 = DISCIPLINES.find((d) => d.id === "100");
  it("une marque valide passe toujours avant un statut", () => {
    expect(compareEntries(time100, { mark: 11.2 }, { status: "DNF" })).toBeLessThan(0);
    expect(compareEntries(time100, { status: "DNS" }, { mark: 11.2 })).toBeGreaterThan(0);
  });
  it("deux statuts sont considérés égaux (ordre indifférent)", () => {
    expect(compareEntries(time100, { status: "DNS" }, { status: "DQ" })).toBe(0);
  });
});
