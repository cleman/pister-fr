import { uid } from "./util";

export function normalizeName(str) {
  return (str || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z\s-]/g, "").replace(/\s+/g, " ").trim();
}

export function tokenKey(str) {
  return normalizeName(str).split(" ").filter(Boolean).sort().join(" ");
}

export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function findAthleteMatches(name, athletes, limit) {
  const norm = normalizeName(name);
  const tok = tokenKey(name);
  if (!norm) return [];
  const scored = athletes
    .map((a) => {
      const aNorm = normalizeName(a.canonicalName);
      const aTok = tokenKey(a.canonicalName);
      let score = levenshtein(norm, aNorm);
      if (aTok === tok) score = 0;
      return { athlete: a, score };
    })
    .filter((s) => s.score <= Math.max(2, Math.floor(norm.length * 0.2)))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit || 4);
  return scored.map((s) => s.athlete);
}

export function resolveAthlete(name, club, athletes) {
  const matches = findAthleteMatches(name, athletes, 1);
  if (matches.length) {
    const m = matches[0];
    const close = normalizeName(m.canonicalName) === normalizeName(name)
      || tokenKey(m.canonicalName) === tokenKey(name)
      || levenshtein(normalizeName(name), normalizeName(m.canonicalName)) <= 2;
    if (close) return { id: m.id, isNew: false, canonicalName: m.canonicalName, club: club || m.club };
  }
  return { id: uid(), isNew: true, canonicalName: name.trim(), club };
}

export function resolveBlockEntries(entries, athletesReg, gender) {
  let reg = athletesReg;
  const resolved = entries.map((e) => {
    const r = resolveAthlete(e.name, e.club, reg);
    if (r.isNew) reg = [...reg, { id: r.id, canonicalName: r.canonicalName, club: e.club, gender: gender || null }];
    else reg = reg.map((a) => (a.id === r.id ? { ...a, club: e.club || a.club, gender: a.gender || gender || null } : a));
    return { ...e, name: r.canonicalName, athleteId: r.id };
  });
  return { entries: resolved, registry: reg };
}
