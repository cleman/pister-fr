import { describe, it, expect } from "vitest";
import { formatTime, parseTimeString, parseTimeToken, extractWind, CLOCK_IDS } from "./time";

describe("formatTime", () => {
  it("formate une course courte en secondes.centièmes", () => {
    expect(formatTime("100", 10.38)).toBe("10.38");
  });
  it("formate une course longue en minutes:secondes", () => {
    expect(formatTime("800", 104.91)).toBe("1:44.91");
  });
  it("passe en h:mm:ss au-delà d'une heure (marathon)", () => {
    // 2h 05m 23.45s = 2*3600 + 5*60 + 23.45
    const total = 2 * 3600 + 5 * 60 + 23.45;
    expect(formatTime("marathon", total)).toBe("2:05:23.45");
  });
  it("renvoie un tiret pour une valeur invalide", () => {
    expect(formatTime("100", NaN)).toBe("—");
    expect(formatTime("100", null)).toBe("—");
    expect(formatTime("100", undefined)).toBe("—");
  });
  it("CLOCK_IDS contient bien les nouvelles épreuves route/relais", () => {
    expect(CLOCK_IDS).toContain("marathon");
    expect(CLOCK_IDS).toContain("4x400");
    expect(CLOCK_IDS).not.toContain("100");
    expect(CLOCK_IDS).not.toContain("4x100");
  });
});

describe("parseTimeString (notation standard)", () => {
  it("secondes.centièmes", () => {
    expect(parseTimeString("10.38")).toBeCloseTo(10.38, 2);
  });
  it("minutes:secondes", () => {
    expect(parseTimeString("1:44.91")).toBeCloseTo(104.91, 2);
  });
  it("heures:minutes:secondes", () => {
    expect(parseTimeString("2:05:23")).toBeCloseTo(7523, 1);
  });
  it("virgule comme séparateur décimal", () => {
    expect(parseTimeString("10,38")).toBeCloseTo(10.38, 2);
  });
  it("renvoie null pour une entrée invalide", () => {
    expect(parseTimeString("NP")).toBeNull();
    expect(parseTimeString("")).toBeNull();
    expect(parseTimeString(null)).toBeNull();
  });
});

describe("parseTimeToken (notation française à apostrophes + repli standard)", () => {
  it("apostrophe triple : minutes'secondes''centièmes", () => {
    expect(parseTimeToken("9'56''17")).toBeCloseTo(596.17, 2);
  });
  it("apostrophe simple/double sans minutes : secondes''centièmes", () => {
    expect(parseTimeToken("13''34")).toBeCloseTo(13.34, 2);
  });
  it("ignore un vent accolé après un espace", () => {
    expect(parseTimeToken("13''34 (0.213)")).toBeCloseTo(13.34, 2);
  });
  it("notation standard toujours acceptée", () => {
    expect(parseTimeToken("10.38")).toBeCloseTo(10.38, 2);
  });
  it("renvoie null pour un code non-partant", () => {
    expect(parseTimeToken("NP")).toBeNull();
    expect(parseTimeToken("DNF")).toBeNull();
    expect(parseTimeToken("AB")).toBeNull();
  });
});

describe("extractWind", () => {
  it("extrait un vent positif entre parenthèses", () => {
    expect(extractWind("13''34 (+0.9)")).toBeCloseTo(0.9, 1);
  });
  it("extrait un vent négatif", () => {
    expect(extractWind("13''24 (-0.9)")).toBeCloseTo(-0.9, 1);
  });
  it("extrait un vent sans signe explicite", () => {
    expect(extractWind("13''34 (0.213)")).toBeCloseTo(0.213, 2);
  });
  it("renvoie null en l'absence de parenthèses", () => {
    expect(extractWind("13''34")).toBeNull();
  });
});
