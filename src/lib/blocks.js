import { compareMarks } from "./marks";

/**
 * Compare deux entrées pour le tri d'un bloc : les statuts (DNS/DNF/DQ,
 * sans marque numérique) passent toujours après les marques valides.
 */
export function compareEntries(discipline, a, b) {
  if (a.status && b.status) return 0;
  if (a.status) return 1;
  if (b.status) return -1;
  return compareMarks(discipline, a.mark, b.mark);
}

/**
 * Insère (ou remplace, upsert par athleteId) une entrée dans une liste
 * d'entrées de bloc.
 *
 * - Si `entry.place` est fourni explicitement (donnée connue de la
 *   source, ex. "13e" dans un bilan), il est conservé tel quel et les
 *   autres entrées ne sont PAS renumérotées — on n'a pas forcément tout
 *   le plateau sous les yeux, recalculer inventerait un classement faux.
 * - Sinon, la place est déduite du tri par marque (comportement adapté
 *   quand on saisit TOUT le plateau d'un coup, ex. éditeur de
 *   compétition), en poussant les DNS/DNF/DQ à la fin.
 */
export function upsertBlockEntry(discipline, existingEntries, entry) {
  const others = existingEntries.filter((e) => e.athleteId !== entry.athleteId);
  if (entry.place) {
    return [...others, entry].sort((a, b) => (a.place || 999) - (b.place || 999));
  }
  return [...others, entry]
    .sort((a, b) => compareEntries(discipline, a, b))
    .map((e, i) => ({ ...e, place: e.status ? null : i + 1 }));
}

/**
 * Retire l'entrée d'un athlète d'une liste, SANS renuméroter les places
 * restantes (qui peuvent être des places réelles connues de la source —
 * les renuméroter effacerait cette information et en inventerait une
 * fausse).
 */
export function removeBlockEntry(existingEntries, athleteId) {
  return existingEntries.filter((e) => e.athleteId !== athleteId);
}
