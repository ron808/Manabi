// The vermilion cloud bands (雲) used by the page-change curtain and the
// first-load reveal — stacked like the layered clouds of a folding screen.

export const CLOUD_EDGE = 80; // height of the billowing edge, px

/**
 * Back to front. `stop` is where each band's edge settles, as a fraction of
 * the screen height from the top (0 = the back band fills the whole screen).
 * Bands rise front-first, so each new one appears above the last — the
 * stack builds upward — and drop back-first, clearing the screen from the top.
 */
export const CLOUD_BANDS = [
  { color: "rgb(var(--accent-ink))", stop: 0, bump: 160, seed: 1 },
  { color: "rgb(var(--accent))", stop: 0.3, bump: 135, seed: 2 },
  { color: "color-mix(in srgb, rgb(var(--accent)) 84%, rgb(var(--ground)))", stop: 0.56, bump: 115, seed: 3 },
  { color: "color-mix(in srgb, rgb(var(--accent)) 66%, rgb(var(--ground)))", stop: 0.79, bump: 100, seed: 4 },
] as const;

/** Where the copy sits: inside the second band, which is solid accent. */
export const CLOUD_COPY_TOP = 0.3;
export const CLOUD_COPY_BOTTOM = 0.56;

/**
 * A billowing cloud edge for the top of a band: bumps of uneven width and
 * height. Deterministic per seed, so server and client draw the same shape.
 */
export function cloudPath(bump: number, seed: number) {
  const w = 1200;
  const base = CLOUD_EDGE * 0.72;
  const rand = (i: number) => Math.abs((Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453) % 1);
  let d = `M0 ${CLOUD_EDGE} L0 ${base}`;
  let x = 0;
  for (let i = 0; x < w; i++) {
    const width = bump * (0.65 + rand(i) * 0.8);
    const height = Math.min(base - 4, width * (0.32 + rand(i + 7) * 0.22));
    const next = Math.min(w, x + width);
    d += ` C${(x + width * 0.04).toFixed(1)} ${(base - height).toFixed(1)} ${(next - width * 0.04).toFixed(1)} ${(base - height).toFixed(1)} ${next.toFixed(1)} ${base.toFixed(1)}`;
    x = next;
  }
  return `${d} L${w} ${CLOUD_EDGE} Z`;
}
