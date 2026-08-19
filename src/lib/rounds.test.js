import { describe, it, expect } from "vitest";
import { roundKey, roundLabel, compareRounds, nextHeatNumber, defaultRound, blockKey, envLabel, OVERVIEW_ROUND } from "./rounds";

describe("roundKey", () => {
  it("identifie de façon unique type+numéro", () => {
    expect(roundKey({ type: "finale", heat: null })).toBe("finale-0");
    expect(roundKey({ type: "demi", heat: 2 })).toBe("demi-2");
  });
  it("gère l'absence de tour", () => {
    expect(roundKey(null)).toBe("none");
  });
});

describe("roundLabel", () => {
  it("une seule finale : pas de numéro affiché", () => {
    expect(roundLabel({ type: "finale", heat: null })).toBe("Finale");
    expect(roundLabel({ type: "finale", heat: 1 })).toBe("Finale");
  });
  it("plusieurs finales : numérotées, y compris la première si forcé", () => {
    expect(roundLabel({ type: "finale", heat: 2 })).toBe("Finale 2");
    expect(roundLabel({ type: "finale", heat: 1 }, true)).toBe("Finale 1");
  });
  it("demi-finales et séries toujours numérotées", () => {
    expect(roundLabel({ type: "demi", heat: 1 })).toBe("Demi-finale 1");
    expect(roundLabel({ type: "serie", heat: 3 })).toBe("Série 3");
  });
  it("vue d'ensemble", () => {
    expect(roundLabel(OVERVIEW_ROUND)).toBe("Vue d'ensemble");
  });
});

describe("compareRounds", () => {
  it("ordonne finale < demi < série", () => {
    const finale = { type: "finale", heat: 1 };
    const demi = { type: "demi", heat: 1 };
    const serie = { type: "serie", heat: 1 };
    expect(compareRounds(finale, demi)).toBeLessThan(0);
    expect(compareRounds(demi, serie)).toBeLessThan(0);
  });
  it("à type égal, ordonne par numéro croissant", () => {
    expect(compareRounds({ type: "serie", heat: 1 }, { type: "serie", heat: 2 })).toBeLessThan(0);
  });
});

describe("nextHeatNumber", () => {
  it("commence à 1 si aucun tour existant", () => {
    expect(nextHeatNumber([], "serie")).toBe(1);
  });
  it("prend le numéro suivant le plus haut", () => {
    const existing = [{ type: "serie", heat: 1 }, { type: "serie", heat: 2 }];
    expect(nextHeatNumber(existing, "serie")).toBe(3);
  });
  it("comble un trou plutôt que d'aller au-delà", () => {
    const existing = [{ type: "serie", heat: 1 }, { type: "serie", heat: 3 }];
    expect(nextHeatNumber(existing, "serie")).toBe(2);
  });
  it("ignore les tours d'un autre type", () => {
    const existing = [{ type: "demi", heat: 1 }];
    expect(nextHeatNumber(existing, "finale")).toBe(1);
  });
});

describe("defaultRound", () => {
  it("null si aucun bloc", () => {
    expect(defaultRound([])).toBeNull();
  });
  it("préfère la finale si elle existe", () => {
    const blocks = [{ round: { type: "serie", heat: 1 } }, { round: { type: "finale", heat: 1 } }];
    expect(defaultRound(blocks).type).toBe("finale");
  });
  it("choisit la finale la plus ancienne (numéro le plus bas) s'il y en a plusieurs", () => {
    const blocks = [
      { round: { type: "finale", heat: 2 } },
      { round: { type: "finale", heat: 1 } },
    ];
    expect(defaultRound(blocks).heat).toBe(1);
  });
  it("repli sur le premier bloc si aucune finale", () => {
    const blocks = [{ round: { type: "serie", heat: 1 } }];
    expect(defaultRound(blocks).type).toBe("serie");
  });
});

describe("blockKey / envLabel", () => {
  it("environnement par défaut = outdoor", () => {
    const k1 = blockKey("100", "H", undefined, { type: "finale", heat: null });
    const k2 = blockKey("100", "H", "outdoor", { type: "finale", heat: null });
    expect(k1).toBe(k2);
  });
  it("distingue indoor et outdoor", () => {
    const round = { type: "finale", heat: null };
    expect(blockKey("800", "H", "indoor", round)).not.toBe(blockKey("800", "H", "outdoor", round));
  });
  it("envLabel lisible", () => {
    expect(envLabel("indoor")).toMatch(/salle/i);
    expect(envLabel("outdoor")).toMatch(/plein air/i);
  });
});
