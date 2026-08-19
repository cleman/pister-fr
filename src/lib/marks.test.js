import { describe, it, expect } from "vitest";
import { formatMark, parseMarkToken, compareMarks, isBetterMark, isLegalWind } from "./marks";
import { DISCIPLINES } from "../data/disciplines";

const time100 = DISCIPLINES.find((d) => d.id === "100");
const longueur = DISCIPLINES.find((d) => d.id === "longueur");
const combine = DISCIPLINES.find((d) => d.id === "combine");

describe("formatMark", () => {
  it("temps : délègue à formatTime", () => {
    expect(formatMark(time100, 10.38)).toBe("10.38");
  });
  it("distance : toujours 2 décimales", () => {
    expect(formatMark(longueur, 6.9)).toBe("6.90");
  });
  it("points : entier arrondi", () => {
    expect(formatMark(combine, 4413)).toBe("4413");
  });
  it("valeur invalide -> tiret", () => {
    expect(formatMark(longueur, null)).toBe("—");
  });
});

describe("parseMarkToken", () => {
  it("distance : 'm' est un séparateur décimal français (6m98 = 6.98)", () => {
    expect(parseMarkToken(longueur, "6m98")).toBeCloseTo(6.98, 2);
  });
  it("distance : notation standard avec point également acceptée", () => {
    expect(parseMarkToken(longueur, "6.98")).toBeCloseTo(6.98, 2);
  });
  it("distance : un entier nu n'est PAS une marque valide (protège contre une année)", () => {
    expect(parseMarkToken(longueur, "2026")).toBeNull();
  });
  it("points : espace comme séparateur de milliers", () => {
    expect(parseMarkToken(combine, "4 413 pts")).toBe(4413);
  });
  it("temps : délègue à parseTimeToken", () => {
    expect(parseMarkToken(time100, "10.38")).toBeCloseTo(10.38, 2);
  });
});

describe("compareMarks / isBetterMark", () => {
  it("temps : plus petit = meilleur (comparateur croissant)", () => {
    expect(compareMarks(time100, 10.0, 11.0)).toBeLessThan(0);
    expect(isBetterMark(time100, 10.0, 11.0)).toBe(true);
    expect(isBetterMark(time100, 11.0, 10.0)).toBe(false);
  });
  it("distance/points : plus grand = meilleur (comparateur décroissant)", () => {
    expect(compareMarks(longueur, 7.5, 6.5)).toBeLessThan(0);
    expect(isBetterMark(longueur, 7.5, 6.5)).toBe(true);
    expect(isBetterMark(longueur, 6.5, 7.5)).toBe(false);
  });
  it("isBetterMark gère les valeurs absentes", () => {
    expect(isBetterMark(time100, 10.0, null)).toBe(true);
    expect(isBetterMark(time100, null, 10.0)).toBe(false);
  });
});

describe("isLegalWind", () => {
  it("légal si absent (pas de mesure)", () => {
    expect(isLegalWind(null)).toBe(true);
    expect(isLegalWind(undefined)).toBe(true);
  });
  it("légal jusqu'à +2.0 inclus", () => {
    expect(isLegalWind(2.0)).toBe(true);
    expect(isLegalWind(-3.5)).toBe(true);
  });
  it("non homologable au-delà de +2.0", () => {
    expect(isLegalWind(2.1)).toBe(false);
  });
});
