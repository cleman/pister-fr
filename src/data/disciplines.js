export const DISCIPLINES = [
  { id: "100", label: () => "100 m", hasWind: true },
  { id: "200", label: () => "200 m", hasWind: true },
  { id: "400", label: () => "400 m", hasWind: false },
  { id: "800", label: () => "800 m", hasWind: false },
  { id: "1500", label: () => "1500 m", hasWind: false },
  { id: "3000", label: () => "3000 m", hasWind: false },
  { id: "3000sc", label: () => "3000 m steeple", hasWind: false },
  { id: "5000", label: () => "5000 m", hasWind: false },
  { id: "10000", label: () => "10000 m", hasWind: false },
  { id: "haies-courtes", label: (g) => (g === "H" ? "110 m haies" : "100 m haies"), hasWind: true },
  { id: "400h", label: () => "400 m haies", hasWind: false },
];

export function getLabel(discipline, gender) {
  return discipline.label(gender);
}
