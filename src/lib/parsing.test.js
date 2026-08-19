import { describe, it, expect } from "vitest";
import { parseTextTable, parseAthleteHistoryText, parseSingleDisciplineHistoryText } from "./parsing";
import { DISCIPLINES, DISCIPLINE_ALIASES } from "../data/disciplines";

const find = (id) => DISCIPLINES.find((d) => d.id === id);

describe("parseTextTable — résultats de compétition (discipline connue)", () => {
  it("lit la longueur avec vent, notation française 6m98", () => {
    const text = `1\t6m98 (+0.9)\tKPATCHA Hilary\tNice Cote D'azur Athletisme *\t006\tPCA\tSEF/98\tIA\t1213
2\t6m86 (+1.6)\tDAVID Yanis Esmeralda\tCa Montreuil 93\t093\tI-F\tSEF/97\tIA\t1187`;
    const rows = parseTextTable(text, find("longueur"));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ place: 1, name: "KPATCHA Hilary", mark: 6.98, wind: 0.9 });
    expect(rows[1].mark).toBe(6.86);
  });

  it("lit un relais (équipes tout en majuscules, sans club distinct)", () => {
    const text = `1\t49''23\tDIJON UC*\t \t \t \tJUF/\t \t926
2\t51''84\tASPTT DIJON ATHLETISME 1\t \t \t \tSEF/\t \t829`;
    const rows = parseTextTable(text, find("4x100"));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ place: 1, name: "DIJON UC", mark: 49.23 });
    expect(rows[0].club).toBe("");
    expect(rows[1].name).toBe("ASPTT DIJON ATHLETISME 1");
  });

  it("ne confond pas une distance avec un entier nu (ex: une année)", () => {
    expect(parseTextTable("1\t2026\tX\tY", find("disque"))).toHaveLength(0);
  });
});

describe("parseAthleteHistoryText — bilan de saison (sans année)", () => {
  const text = `1 Août \t1 500m \t4'11''86 \t\tFinal 3 \t1 \tN1 \t1112 \tOordegem
30 Mai \t3000m Steeple (76) \tNP \t\tFinal 1 \t\t\t\tToulouse
17 Mai \tPoids (4 kg) \t7m29 \t\tFinal 1 \t4 \tD2 \t419 \tChalon Sur Saone`;

  it("reconnaît les lignes valides et ignore les non-partants", () => {
    const rows = parseAthleteHistoryText(text, DISCIPLINES, DISCIPLINE_ALIASES, 2026);
    expect(rows).toHaveLength(2); // la ligne "NP" est ignorée
    const r1500 = rows.find((r) => r.disciplineId === "1500");
    expect(r1500.mark).toBeCloseTo(251.86, 2); // 4'11''86 = 4*60+11.86
    expect(r1500.date).toBe("2026-08-01");
    expect(r1500.competition).toBe("Oordegem");
    const poids = rows.find((r) => r.disciplineId === "poids");
    expect(poids.mark).toBeCloseTo(7.29, 2);
  });
});

describe("parseAthleteHistoryText — fiche de records (avec année, club variable)", () => {
  it("lit une date complète et un score en points avec espace (milliers)", () => {
    const text = `100m \t13''24 (-0.9) \t4 Juil 2018 \tSE \tEa Le Creusot \tBFC / 071 \tChalon sur saone
Heptathlon JSF \t4 413 pts \t23 Juin 2018 \tSE \tEa Le Creusot \tBFC / 071 \tOyonnax`;
    const rows = parseAthleteHistoryText(text, DISCIPLINES, DISCIPLINE_ALIASES, 2026);
    expect(rows).toHaveLength(2);
    const sprint = rows.find((r) => r.disciplineId === "100");
    expect(sprint.date).toBe("2018-07-04");
    expect(sprint.mark).toBeCloseTo(13.24, 2);
    expect(sprint.wind).toBeCloseTo(-0.9, 1);
    const hepta = rows.find((r) => r.disciplineId === "combine");
    expect(hepta.mark).toBe(4413); // pas 4 (piège de l'espace comme séparateur de milliers)
  });
});

describe("parseSingleDisciplineHistoryText — bilan annuel d'une seule épreuve", () => {
  it("ignore la colonne année redondante et détecte les changements de club", () => {
    const text = `2026 \t9 Avr. 2026 \t65m96 \tLyon Athletisme \tARA / 069 \tRamona (USA)
2001 \t13 Juin 2001 \t63m87 \tCs Bourgoin-Jallieu \tR-A / 038 \tMiramas`;
    const rows = parseSingleDisciplineHistoryText(text, find("disque"), 2026);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ mark: 65.96, club: "Lyon Athletisme", competition: "Ramona (USA)" });
    expect(rows[1].club).toBe("Cs Bourgoin-Jallieu");
  });
});
