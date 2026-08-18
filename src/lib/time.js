export const CLOCK_IDS = ["800", "1500", "3000", "3000sc", "5000", "10000"];

export function formatTime(disciplineId, totalSeconds) {
  if (typeof totalSeconds !== "number" || isNaN(totalSeconds)) return "—";
  if (CLOCK_IDS.includes(disciplineId)) {
    const m = Math.floor(totalSeconds / 60);
    const s = (totalSeconds % 60).toFixed(2).padStart(5, "0");
    return `${m}:${s}`;
  }
  return totalSeconds.toFixed(2);
}

export function parseTimeString(str) {
  if (!str) return null;
  const s = String(str).trim().replace(",", ".").replace(/[^0-9:.]/g, "");
  if (!s) return null;
  if (s.includes(":")) {
    const parts = s.split(":");
    if (parts.length === 2) {
      const min = parseFloat(parts[0]), sec = parseFloat(parts[1]);
      if (!isNaN(min) && !isNaN(sec)) return min * 60 + sec;
    }
    if (parts.length === 3) {
      const h = parseFloat(parts[0]), m = parseFloat(parts[1]), sec = parseFloat(parts[2]);
      if (![h, m, sec].some(isNaN)) return h * 3600 + m * 60 + sec;
    }
    return null;
  }
  const v = parseFloat(s);
  return isNaN(v) ? null : v;
}

/* convertit un token de temps, notation standard (9:26.74 / 10.38) OU
   notation française à apostrophes (9'26''74 / 10''38) — ignore tout ce qui
   suit (ex: vent "(0.213)") */
export function parseTimeToken(raw) {
  if (!raw) return null;
  const token = String(raw).trim().split(/\s+/)[0];
  if (/^\d{1,2}(:\d{2})?[.,]\d{2}$/.test(token)) return parseTimeString(token);
  if (/['\u2019\u02b9"\u201d\u2033`]/.test(token)) {
    const nums = token.match(/\d+/g);
    if (!nums) return null;
    if (nums.length === 3) {
      const [m, s, c] = nums.map(Number);
      if (s < 60 && c < 100) return m * 60 + s + c / 100;
    }
    if (nums.length === 2) {
      const [a, b] = nums.map(Number);
      if (b < 100) return a + b / 100;
    }
  }
  return null;
}

/* extrait un vent éventuel entre parenthèses accolé au temps, ex "13''34 (0.213)" */
export function extractWind(raw) {
  const m = String(raw || "").match(/\(([+-]?\d+(?:[.,]\d+)?)\)/);
  if (!m) return null;
  const v = parseFloat(m[1].replace(",", "."));
  return isNaN(v) ? null : v;
}
