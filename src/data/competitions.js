export const TIER_WEIGHT = { majeure: 0, nationale: 1, circuit: 2, regionale: 3 };

export const TIERS = {
  majeure: { label: "Majeure", style: { background: "var(--track)", color: "#fff", border: "1px solid var(--track)" } },
  nationale: { label: "Nationale", style: { background: "var(--ink)", color: "#fff", border: "1px solid var(--ink)" } },
  circuit: { label: "Circuit", style: { background: "transparent", color: "var(--track)", border: "1px solid var(--track)" } },
  regionale: { label: "Régionale", style: { background: "transparent", color: "var(--steel)", border: "1px solid var(--line)" } },
};

export const STATUS_INFO = {
  a_venir: { label: "À venir", style: { color: "var(--steel)", border: "1px solid var(--line)" } },
  a_saisir: { label: "À saisir", style: { color: "var(--track)", border: "1px solid var(--track)" } },
  en_cours: { label: "En cours", style: { background: "transparent", color: "var(--lane-yellow)", border: "1px solid var(--lane-yellow)" } },
  saisi: { label: "Saisi", style: { background: "var(--lane-yellow)", color: "var(--ink)", border: "1px solid var(--lane-yellow)" } },
};

export const DEFAULT_COMPETITIONS = [
  { id: "albi2026", name: "Championnats de France Élite 2026", date: "2026-07-25", location: "Albi (Stadium Municipal)", tier: "nationale", following: false, manualComplete: false },
  { id: "euro2026", name: "Championnats d'Europe 2026", date: "2026-08-13", location: "Birmingham (GBR)", tier: "majeure", following: true, manualComplete: false },
  { id: "sotteville2026", name: "Meeting Élite de Sotteville", date: "2026-06-14", location: "Sotteville-lès-Rouen", tier: "circuit", following: false, manualComplete: false },
  { id: "parisdl2026", name: "Meeting de Paris (Diamond League)", date: "2026-09-05", location: "Stade Charléty, Paris", tier: "majeure", following: true, manualComplete: false },
  { id: "france2025", name: "Championnats de France Élite 2025", date: "2025-08-01", location: "Talence", tier: "nationale", following: false, manualComplete: false },
];
