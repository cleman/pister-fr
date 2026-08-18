export const DISCIPLINES = [
  // Courses (marque = temps, plus petit = meilleur)
  { id: "100", label: () => "100 m", type: "time", hasWind: true },
  { id: "200", label: () => "200 m", type: "time", hasWind: true },
  { id: "400", label: () => "400 m", type: "time", hasWind: false },
  { id: "800", label: () => "800 m", type: "time", hasWind: false },
  { id: "1500", label: () => "1500 m", type: "time", hasWind: false },
  { id: "3000", label: () => "3000 m", type: "time", hasWind: false },
  { id: "3000sc", label: () => "3000 m steeple", type: "time", hasWind: false },
  { id: "5000", label: () => "5000 m", type: "time", hasWind: false },
  { id: "10000", label: () => "10000 m", type: "time", hasWind: false },
  { id: "haies-courtes", label: (g) => (g === "H" ? "110 m haies" : "100 m haies"), type: "time", hasWind: true },
  { id: "400h", label: () => "400 m haies", type: "time", hasWind: false },

  // Sauts (marque = distance en mètres, plus grand = meilleur)
  { id: "longueur", label: () => "Longueur", type: "distance", hasWind: true },
  { id: "triple-saut", label: () => "Triple saut", type: "distance", hasWind: true },
  { id: "hauteur", label: () => "Hauteur", type: "distance", hasWind: false },
  { id: "perche", label: () => "Perche", type: "distance", hasWind: false },

  // Lancers (marque = distance en mètres, plus grand = meilleur)
  { id: "poids", label: () => "Poids", type: "distance", hasWind: false },
  { id: "disque", label: () => "Disque", type: "distance", hasWind: false },
  { id: "marteau", label: () => "Marteau", type: "distance", hasWind: false },
  { id: "javelot", label: () => "Javelot", type: "distance", hasWind: false },

  // Épreuves combinées (marque = points, plus grand = meilleur)
  { id: "combine", label: (g) => (g === "H" ? "Décathlon" : "Heptathlon"), type: "points", hasWind: false },
];

export function getLabel(discipline, gender) {
  return discipline.label(gender);
}

/* alias reconnus lors du collage de texte (ex. bilan FFA), pour retrouver
   l'id de discipline à partir d'un libellé en français */
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
