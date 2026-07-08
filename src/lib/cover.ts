/**
 * Deterministic neutral cover placeholder — used wherever a record has no real
 * image yet (campaigns/products/brands have no cover column; assets before the
 * generated file exists). NOT stock photography: a seeded abstract gradient so
 * the UI has texture without fabricating product imagery.
 */
const PALETTES: [string, string][] = [
  ["#1f6f4f", "#0f3d2b"],
  ["#3b5bdb", "#1e2f6b"],
  ["#7048e8", "#2f1d5c"],
  ["#c2410c", "#5c2109"],
  ["#0891b2", "#0b3d47"],
  ["#be185d", "#5c0c2c"],
];

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Returns an inline SVG data-URI gradient, stable for a given seed (e.g. row id). */
export function coverFor(seed: string): string {
  const [a, b] = PALETTES[hash(seed) % PALETTES.length]!;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>` +
    `</linearGradient></defs><rect width="480" height="360" fill="url(#g)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
