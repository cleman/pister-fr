import { describe, it, expect } from "vitest";
import { DISCIPLINES, DISCIPLINE_ALIASES, DISCIPLINE_CATEGORIES, getLabel, disciplinesByCategory } from "./disciplines";

describe("intégrité de DISCIPLINES", () => {
  it("tous les ids sont uniques", () => {
    const ids = DISCIPLINES.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("chaque discipline a les champs requis et valides", () => {
    const validTypes = ["time", "distance", "points"];
    const validCategories = DISCIPLINE_CATEGORIES.map((c) => c.id);
    DISCIPLINES.forEach((d) => {
      expect(typeof d.id).toBe("string");
      expect(typeof d.label).toBe("function");
      expect(validTypes).toContain(d.type);
      expect(typeof d.hasWind).toBe("boolean");
      expect(validCategories).toContain(d.category);
      expect(typeof d.indoorEligible).toBe("boolean");
    });
  });

  it("getLabel renvoie un libellé non vide pour les deux sexes", () => {
    DISCIPLINES.forEach((d) => {
      expect(getLabel(d, "H").length).toBeGreaterThan(0);
      expect(getLabel(d, "F").length).toBeGreaterThan(0);
    });
  });
});

describe("DISCIPLINE_ALIASES — piège classique : un alias qui pointe vers un id inexistant", () => {
  it("chaque alias correspond à une discipline réellement définie", () => {
    const validIds = new Set(DISCIPLINES.map((d) => d.id));
    Object.entries(DISCIPLINE_ALIASES).forEach(([alias, targetId]) => {
      expect(validIds.has(targetId), `alias "${alias}" pointe vers un id inconnu : "${targetId}"`).toBe(true);
    });
  });
});

describe("disciplinesByCategory", () => {
  it("couvre chaque discipline exactement une fois", () => {
    const grouped = disciplinesByCategory("H");
    const flatIds = grouped.flatMap((g) => g.disciplines.map((d) => d.id));
    expect(flatIds.sort()).toEqual(DISCIPLINES.map((d) => d.id).sort());
  });
  it("ne renvoie jamais de catégorie vide", () => {
    const grouped = disciplinesByCategory("H");
    grouped.forEach((g) => expect(g.disciplines.length).toBeGreaterThan(0));
  });
});
