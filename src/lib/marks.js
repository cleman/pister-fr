import { CLOCK_IDS, formatTime, parseTimeToken } from "./time";

/**
 * Une discipline a un type : "time" (course), "distance" (sauts/lancers,
 * en mètres) ou "points" (épreuves combinées). Ces fonctions savent
 * formater/parser/comparer une marque quel que soit le type, à partir de
 * l'objet discipline (voir data/disciplines.js).
 */

export function formatMark(discipline, value) {
  if (typeof value !== "number" || isNaN(value)) return "—";
  if (discipline.type === "time") return formatTime(discipline.id, value);
  if (discipline.type === "points") return String(Math.round(value));
  return value.toFixed(2); // distance, en mètres
}

export function parseMarkToken(discipline, raw) {
  if (discipline.type === "time") return parseTimeToken(raw);
  if (discipline.type === "points") {
    const m = String(raw || "").trim().match(/^[\d\s]+/);
    if (!m) return null;
    const digits = m[0].replace(/\s+/g, "");
    const v = parseInt(digits, 10);
    return isNaN(v) || v <= 0 ? null : v;
  }
  const token = String(raw || "").trim().split(/\s+/)[0];
  // notation française : "6m98" = 6.98 (le 'm' sert de séparateur décimal,
  // comme l'apostrophe pour les temps) — pas un simple suffixe d'unité.
  const cleaned = token.replace(/m/i, ".").replace(",", ".");
  // une distance s'écrit toujours avec décimales (6m98 -> 6.98) ; un entier
  // nu (ex: une année "2026") ne doit jamais être pris pour une marque.
  if (discipline.type === "distance" && !/\./.test(cleaned)) return null;
  const v = parseFloat(cleaned);
  return isNaN(v) ? null : v;
}

/* renvoie un nombre négatif si a est meilleur que b, positif sinon —
   utilisable directement dans Array.sort */
export function compareMarks(discipline, a, b) {
  if (discipline.type === "time") return a - b; // plus petit = meilleur
  return b - a; // distance/points : plus grand = meilleur
}

export function isBetterMark(discipline, a, b) {
  if (a === null || a === undefined) return false;
  if (b === null || b === undefined) return true;
  return compareMarks(discipline, a, b) < 0;
}

export { CLOCK_IDS };
