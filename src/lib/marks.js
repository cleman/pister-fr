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
  const token = String(raw || "").trim().split(/\s+/)[0];
  // notation française : "6m98" = 6.98 (le 'm' sert de séparateur décimal,
  // comme l'apostrophe pour les temps) — pas un simple suffixe d'unité.
  const cleaned = token.replace(/m/i, ".").replace(",", ".");
  const v = parseFloat(cleaned);
  if (isNaN(v)) return null;
  if (discipline.type === "points") return Math.round(v);
  return v;
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
