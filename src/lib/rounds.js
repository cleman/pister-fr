const ROUND_ORDER = { finale: 0, demi: 1, serie: 2 };

export function roundKey(round) {
  if (!round) return "none";
  return `${round.type}-${round.heat || 0}`;
}

export function roundLabel(round) {
  if (!round) return "";
  if (round.type === "finale") return "Finale";
  if (round.type === "demi") return `Demi-finale ${round.heat}`;
  return `Série ${round.heat}`;
}

export function compareRounds(a, b) {
  if (ROUND_ORDER[a.type] !== ROUND_ORDER[b.type]) return ROUND_ORDER[a.type] - ROUND_ORDER[b.type];
  return (a.heat || 0) - (b.heat || 0);
}

export function nextHeatNumber(existingRounds, type) {
  const used = existingRounds.filter((r) => r.type === type).map((r) => r.heat || 0);
  let n = 1;
  while (used.includes(n)) n++;
  return n;
}

export function defaultRound(blocksForFilter) {
  if (!blocksForFilter.length) return null;
  const finale = blocksForFilter.find((b) => b.round.type === "finale");
  return (finale || blocksForFilter[0]).round;
}
