export const DISCIPLINE_CATEGORIES = [
  { id: "sprint", label: "Sprint" },
  { id: "haies", label: "Haies" },
  { id: "demi-fond", label: "Demi-fond" },
  { id: "fond", label: "Fond (piste)" },
  { id: "route", label: "Route" },
  { id: "relais", label: "Relais" },
  { id: "sauts", label: "Sauts" },
  { id: "lancers", label: "Lancers" },
  { id: "combine", label: "Épreuves combinées" },
];

export const DISCIPLINES = [
  { id: "100", label: () => "100 m", type: "time", hasWind: true, category: "sprint", indoorEligible: false },
  { id: "200", label: () => "200 m", type: "time", hasWind: true, category: "sprint", indoorEligible: true },
  { id: "400", label: () => "400 m", type: "time", hasWind: false, category: "sprint", indoorEligible: true },

  { id: "haies-courtes", label: (g) => (g === "H" ? "110 m haies" : "100 m haies"), type: "time", hasWind: true, category: "haies", indoorEligible: false },
  { id: "400h", label: () => "400 m haies", type: "time", hasWind: false, category: "haies", indoorEligible: false },

  { id: "800", label: () => "800 m", type: "time", hasWind: false, category: "demi-fond", indoorEligible: true },
  { id: "1500", label: () => "1500 m", type: "time", hasWind: false, category: "demi-fond", indoorEligible: true },
  { id: "3000", label: () => "3000 m", type: "time", hasWind: false, category: "demi-fond", indoorEligible: true },

  { id: "3000sc", label: () => "3000 m steeple", type: "time", hasWind: false, category: "fond", indoorEligible: false },
  { id: "5000", label: () => "5000 m", type: "time", hasWind: false, category: "fond", indoorEligible: true },
  { id: "10000", label: () => "10000 m", type: "time", hasWind: false, category: "fond", indoorEligible: false },

  { id: "5km-route", label: () => "5 km route", type: "time", hasWind: false, category: "route", indoorEligible: false },
  { id: "10km-route", label: () => "10 km route", type: "time", hasWind: false, category: "route", indoorEligible: false },
  { id: "semi-marathon", label: () => "Semi-marathon", type: "time", hasWind: false, category: "route", indoorEligible: false },
  { id: "marathon", label: () => "Marathon", type: "time", hasWind: false, category: "route", indoorEligible: false },

  { id: "4x100", label: () => "4 x 100 m", type: "time", hasWind: true, category: "relais", indoorEligible: false },
  { id: "4x400", label: () => "4 x 400 m", type: "time", hasWind: false, category: "relais", indoorEligible: false },

  { id: "longueur", label: () => "Longueur", type: "distance", hasWind: true, category: "sauts", indoorEligible: true },
  { id: "triple-saut", label: () => "Triple saut", type: "distance", hasWind: true, category: "sauts", indoorEligible: true },
  { id: "hauteur", label: () => "Hauteur", type: "distance", hasWind: false, category: "sauts", indoorEligible: true },
  { id: "perche", label: () => "Perche", type: "distance", hasWind: false, category: "sauts", indoorEligible: true },

  { id: "poids", label: () => "Poids", type: "distance", hasWind: false, category: "lancers", indoorEligible: true },
  { id: "disque", label: () => "Disque", type: "distance", hasWind: false, category: "lancers", indoorEligible: false },
  { id: "marteau", label: () => "Marteau", type: "distance", hasWind: false, category: "lancers", indoorEligible: false },
  { id: "javelot", label: () => "Javelot", type: "distance", hasWind: false, category: "lancers", indoorEligible: false },

  { id: "combine", label: (g) => (g === "H" ? "Décathlon" : "Heptathlon"), type: "points", hasWind: false, category: "combine", indoorEligible: true },
];

export function getLabel(discipline, gender) {
  return discipline.label(gender);
}

export function disciplinesByCategory(gender) {
  return DISCIPLINE_CATEGORIES.map((cat) => ({
    ...cat,
    disciplines: DISCIPLINES.filter((d) => d.category === cat.id),
  })).filter((cat) => cat.disciplines.length > 0);
}

/* alias reconnus lors du collage de texte (ex. bilan FFA), pour retrouver
   l'id de discipline à partir d'un libellé en français. Les variantes
   "Piste Courte"/"Salle" sont normalisées vers la même discipline — la
   distinction indoor/plein air est gérée séparément (voir parsing.js). */
export const DISCIPLINE_ALIASES = {
  "100m": "100", "100 m": "100",
  "200m": "200", "200 m": "200",
  "400m": "400", "400 m": "400",
  "800m": "800", "800 m": "800",
  "1500m": "1500", "1500 m": "1500",
  "3000m": "3000", "3000 m": "3000",
  "3000m steeple": "3000sc", "3000 m steeple": "3000sc", "steeple": "3000sc",
  "5000m": "5000", "5000 m": "5000",
  "10000m": "10000", "10000 m": "10000",
  "5 km route": "5km-route", "5km route": "5km-route",
  "10 km route": "10km-route", "10km route": "10km-route",
  "semi marathon": "semi-marathon", "semi-marathon": "semi-marathon",
  "marathon": "marathon",
  "4x100m": "4x100", "4 x 100m": "4x100", "4x100": "4x100",
  "4x400m": "4x400", "4 x 400m": "4x400", "4x400": "4x400",
  "110m haies": "haies-courtes", "110 m haies": "haies-courtes",
  "100m haies": "haies-courtes", "100 m haies": "haies-courtes",
  "400m haies": "400h", "400 m haies": "400h",
  "longueur": "longueur", "saut en longueur": "longueur", "sl": "longueur",
  "triple saut": "triple-saut", "ts": "triple-saut",
  "hauteur": "hauteur", "saut en hauteur": "hauteur", "sh": "hauteur",
  "perche": "perche", "saut a la perche": "perche", "sap": "perche",
  "poids": "poids", "lancer de poids": "poids",
  "disque": "disque", "lancer de disque": "disque",
  "marteau": "marteau", "lancer de marteau": "marteau",
  "javelot": "javelot", "lancer de javelot": "javelot",
  "decathlon": "combine", "heptathlon": "combine",
};
