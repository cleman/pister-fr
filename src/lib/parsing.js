import { parseTimeToken, extractWind } from "./time";
import { parseMarkToken } from "./marks";

/* ------------------------------------------------------------------ */
/* OCR (en pause) — conservé pour reprise ultérieure, non branché à l'UI */
/* ------------------------------------------------------------------ */

export function ensureTesseractLoaded() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (window.__tesseractLoading) return window.__tesseractLoading;
  window.__tesseractLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js";
    script.onload = () => resolve(window.Tesseract);
    script.onerror = () => reject(new Error("Impossible de charger le moteur OCR (connexion requise au premier chargement)."));
    document.head.appendChild(script);
  });
  return window.__tesseractLoading;
}

export function groupWordsByY(words) {
  const usable = (words || []).filter((w) => w.text && w.text.trim());
  if (!usable.length) return [];
  const sorted = [...usable].sort((a, b) => (a.bbox.y0 + a.bbox.y1) / 2 - (b.bbox.y0 + b.bbox.y1) / 2);
  const rows = [];
  let current = [];
  let currentY = null;
  const TOL = 16;
  sorted.forEach((w) => {
    const cy = (w.bbox.y0 + w.bbox.y1) / 2;
    if (currentY === null || Math.abs(cy - currentY) <= TOL) {
      current.push(w);
      currentY = currentY === null ? cy : (currentY + cy) / 2;
    } else {
      rows.push(current);
      current = [w];
      currentY = cy;
    }
  });
  if (current.length) rows.push(current);
  return rows;
}

export function splitIntoColumns(words) {
  const sorted = [...words].sort((a, b) => a.bbox.x0 - b.bbox.x0);
  const widths = sorted.map((w) => Math.max(1, w.bbox.x1 - w.bbox.x0));
  const avgWidth = widths.reduce((a, b) => a + b, 0) / widths.length;
  const columns = [];
  let current = [];
  let prevX1 = null;
  sorted.forEach((w) => {
    const gap = prevX1 === null ? 0 : w.bbox.x0 - prevX1;
    if (prevX1 !== null && gap > avgWidth * 1.6) {
      columns.push(current);
      current = [];
    }
    current.push(w);
    prevX1 = w.bbox.x1;
  });
  if (current.length) columns.push(current);
  return columns.map((col) => col.map((w) => w.text.trim()).join(" ").trim());
}

/* ------------------------------------------------------------------ */
/* Analyse de colonnes — partagée : OCR ou texte collé                 */
/* ------------------------------------------------------------------ */

export function parseColumns(columns, discipline) {
  const rankIdx = columns.findIndex((c) => /^\d{1,3}$/.test(c.trim()));
  if (rankIdx === -1) return null;

  let markIdx = -1, mark = null, wind = null;
  for (let i = 0; i < columns.length; i++) {
    if (i === rankIdx) continue;
    const m = parseMarkToken(discipline || { type: "time" }, columns[i]);
    if (m !== null && m > 0) { markIdx = i; mark = m; wind = extractWind(columns[i]); break; }
  }
  if (markIdx === -1) return null;

  const isNameLike = (c) => /[a-z\u00e0-\u00ff]/.test(c) && !/^\d{4}-\d{2}-\d{2}$/.test(c.trim());
  let name = "", club = "";
  for (let i = 0; i < columns.length; i++) {
    if (i === rankIdx || i === markIdx) continue;
    if (!name && isNameLike(columns[i])) { name = columns[i].trim(); continue; }
    if (name && !club && isNameLike(columns[i])) { club = columns[i].trim(); break; }
  }
  if (!name) return null;

  return { place: parseInt(columns[rankIdx], 10), name, club, mark, wind };
}

export function parseTableRow(words, discipline) {
  const usable = (words || []).filter((w) => w.text && w.text.trim());
  if (usable.length < 2) return null;
  return parseColumns(splitIntoColumns(usable), discipline);
}

/* repli 100% local : analyse d'un texte collé à la main (colonnes séparées
   par tabulation ou 2+ espaces) — c'est la méthode active dans l'UI */
export function parseTextTable(text, discipline) {
  return (text || "")
    .split(/\r?\n+/)
    .map((line) => line.split(/\t+|\s{2,}/).map((c) => c.trim()).filter(Boolean))
    .filter((cols) => cols.length >= 2)
    .map((cols) => parseColumns(cols, discipline))
    .filter(Boolean);
}

export async function ocrExtractRows(file, discipline) {
  const Tesseract = await ensureTesseractLoaded();
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Lecture de l'image impossible"));
    reader.readAsDataURL(file);
  });
  const result = await Tesseract.recognize(dataUrl, "eng");
  const data = result.data || {};
  const lineGroups = (data.lines && data.lines.length)
    ? data.lines.map((l) => (l.words || []).filter((w) => w.text && w.text.trim()))
    : groupWordsByY(data.words || []);
  const rows = lineGroups.map((words) => parseTableRow(words, discipline)).filter(Boolean);
  return { rows, rawText: data.text || "" };
}

/* ------------------------------------------------------------------ */
/* Historique d'un athlète collé en une fois (ex. bilan FFA) — heuristique :
   scanne chaque ligne pour une discipline reconnue, une date, une marque.
   Résultat à vérifier/corriger ligne par ligne avant enregistrement. */
/* ------------------------------------------------------------------ */

function normalizeLabel(s) {
  return String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim();
}

/* nettoie un libellé de discipline avant recherche dans la table d'alias :
   enlève les annotations entre parenthèses (hauteur de haies, poids de
   l'engin...), les mentions "Piste Courte"/"Salle" (indoor, fusionné avec
   l'épreuve plein air faute de distinction dans le modèle actuel), et les
   espaces utilisés comme séparateur de milliers ("1 500m" -> "1500m"). */
function normalizeDisciplineLabel(raw) {
  let s = String(raw || "").trim();
  s = s.replace(/\([^)]*\)/g, " ");
  s = s.replace(/\bpiste courte\b/gi, " ").replace(/\bsalle\b/gi, " ").replace(/\bindoor\b/gi, " ");
  s = s.replace(/(\d)\s+(\d)/g, "$1$2");
  s = s.replace(/\s+/g, " ").trim();
  return normalizeLabel(s);
}

const FR_MONTHS = {
  janv: 1, jan: 1, fev: 2, mars: 3, avr: 4, mai: 5, juin: 6,
  juil: 7, aout: 8, sept: 9, oct: 10, nov: 11, dec: 12,
};

/* dates numériques (12/06/2026) ET format FFA "1 Août" / "28 Fév." (sans
   année — on prend l'année en cours par défaut, à corriger si besoin dans
   le tableau de vérification affiché avant enregistrement) */
function parseFlexibleDate(raw, referenceYear) {
  const token = raw.trim();
  const numeric = token.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (numeric) {
    let [, d, m, y] = numeric;
    if (y.length === 2) y = (parseInt(y, 10) > 50 ? "19" : "20") + y;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // "2 Mars 2008" (jour + mois en lettres + année) — format de la fiche de records
  const frWithYear = token.match(/^(\d{1,2})\s+([a-zà-ÿ.]+)\s+(\d{4})$/i);
  if (frWithYear) {
    const day = frWithYear[1].padStart(2, "0");
    const key = normalizeLabel(frWithYear[2]).replace(/\.$/, "").slice(0, 5);
    const monthNum = FR_MONTHS[key] || FR_MONTHS[key.slice(0, 4)] || FR_MONTHS[key.slice(0, 3)];
    if (monthNum) return `${frWithYear[3]}-${String(monthNum).padStart(2, "0")}-${day}`;
  }
  // "1 Août" (jour + mois en lettres, sans année) — format du bilan de saison
  const frMatch = token.match(/^(\d{1,2})\s+([a-zà-ÿ.]+)$/i);
  if (frMatch) {
    const day = frMatch[1].padStart(2, "0");
    const key = normalizeLabel(frMatch[2]).replace(/\.$/, "").slice(0, 5);
    const monthNum = FR_MONTHS[key] || FR_MONTHS[key.slice(0, 4)] || FR_MONTHS[key.slice(0, 3)];
    if (monthNum) return `${referenceYear}-${String(monthNum).padStart(2, "0")}-${day}`;
  }
  return null;
}

const isDateLike = (s) => {
  const t = s.trim();
  return /^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/.test(t) || /^\d{1,2}\s+[a-zà-ÿ.]+(\s+\d{4})?$/i.test(t);
};
const isRoundLike = (s) => /^(final|s[ée]rie|demi|qualif|h\.?\s*stade)/i.test(s.trim());
const isLevelLike = (s) => /^(N\d|I[AB]|R\d|D\d|IR\d)$/i.test(s.trim());
const isPlaceLike = (s) => /^\d{1,3}(\s*\([^)]*\))?$/.test(s.trim());
const isPointsLike = (s) => /^\d{3,5}$/.test(s.trim());

export function parseAthleteHistoryText(text, disciplinesList, aliases, referenceYear) {
  const year = referenceYear || new Date().getFullYear();
  const rows = [];
  (text || "").split(/\r?\n+/).forEach((line) => {
    const cols = line.split(/\t+|\s{2,}/).map((c) => c.trim()).filter(Boolean);
    if (cols.length < 2) return;

    let disciplineId = null;
    let discIdx = -1;
    for (let i = 0; i < cols.length; i++) {
      const norm = normalizeDisciplineLabel(cols[i]);
      if (aliases[norm]) { disciplineId = aliases[norm]; discIdx = i; break; }
    }
    if (!disciplineId) {
      // repli : plus long préfixe connu (ex. "Heptathlon JSF" -> "heptathlon")
      let bestLen = 0;
      for (let i = 0; i < cols.length; i++) {
        const norm = normalizeDisciplineLabel(cols[i]);
        for (const key of Object.keys(aliases)) {
          if (norm.startsWith(key + " ") && key.length > bestLen) {
            disciplineId = aliases[key]; discIdx = i; bestLen = key.length;
          }
        }
      }
    }
    if (!disciplineId) return;
    const discipline = disciplinesList.find((d) => d.id === disciplineId);
    if (!discipline) return;

    let dateIdx = -1, date = null;
    for (let i = 0; i < cols.length; i++) {
      if (i === discIdx) continue;
      if (isDateLike(cols[i])) { const parsed = parseFlexibleDate(cols[i], year); if (parsed) { dateIdx = i; date = parsed; break; } }
    }

    let markIdx = -1, mark = null, wind = null;
    for (let i = 0; i < cols.length; i++) {
      if (i === discIdx || i === dateIdx) continue;
      const m = parseMarkToken(discipline, cols[i]);
      if (m !== null && m > 0) { markIdx = i; mark = m; wind = extractWind(cols[i]); break; }
    }
    if (mark === null) return;

    const rest = cols.filter((_, i) => i !== discIdx && i !== dateIdx && i !== markIdx);
    const candidates = rest.filter((c) => c && !isRoundLike(c) && !isLevelLike(c) && !isPlaceLike(c) && !isPointsLike(c));
    const competition = (candidates[candidates.length - 1] || "Compétition (à préciser)").trim();

    rows.push({ disciplineId, date, mark, wind, competition });
  });
  return rows;
}
