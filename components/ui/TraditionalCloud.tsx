// A 瑞雲 (zuiun, auspicious cloud) in the manner of old Japanese screens and
// prints: a row of round lobes, each with a curl, a flat banded base, and a
// wisp trailing off to one side. Drawn from a seed so every cloud differs but
// server and client agree.

const W = 440;
const H = 170;
const BASE = 128;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => n.toFixed(1);
const angle = (cx: number, cy: number, x: number, y: number) => (Math.atan2(y - cy, x - cx) * 180) / Math.PI;

interface Lobe {
  cx: number;
  cy: number;
  r: number;
}

/** Upper crossing point of two overlapping circles. */
function valley(a: Lobe, b: Lobe) {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const d = Math.hypot(dx, dy);
  const t = (a.r * a.r - b.r * b.r + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, a.r * a.r - t * t));
  const mx = a.cx + (t * dx) / d;
  const my = a.cy + (t * dy) / d;
  const p1 = { x: mx + (h * dy) / d, y: my - (h * dx) / d };
  const p2 = { x: mx - (h * dy) / d, y: my + (h * dx) / d };
  return p1.y < p2.y ? p1 : p2;
}

/** Clockwise arc over the top of a lobe between two points on it. */
function arcTo(l: Lobe, from: { x: number; y: number }, to: { x: number; y: number }) {
  const span = (((angle(l.cx, l.cy, to.x, to.y) - angle(l.cx, l.cy, from.x, from.y)) % 360) + 360) % 360;
  return `A${f(l.r)} ${f(l.r)} 0 ${span > 180 ? 1 : 0} 1 ${f(to.x)} ${f(to.y)}`;
}

/** Where a lobe meets the base line, on its left or right side. */
function onBase(l: Lobe, side: -1 | 1) {
  const dy = BASE - l.cy;
  return { x: l.cx + side * Math.sqrt(Math.max(0, l.r * l.r - dy * dy)), y: BASE };
}

export function buildCloud(seed: number, lobeCount = 4) {
  const rand = rng(seed);
  const lobes: Lobe[] = [];
  let x = 150;
  for (let i = 0; i < lobeCount; i++) {
    const r = 30 + rand() * 24;
    if (i > 0) x += (lobes[i - 1].r + r) * (0.62 + rand() * 0.1);
    lobes.push({ cx: x, cy: BASE - r * (0.5 + rand() * 0.18), r });
  }
  // Fit the row into the drawing.
  const right = lobes[lobes.length - 1].cx + lobes[lobes.length - 1].r;
  const scale = Math.min(1, (W - 16 - 130) / (right - 130));
  for (const l of lobes) {
    l.cx = 130 + (l.cx - 130) * scale;
    l.r *= scale;
    l.cy = BASE - (BASE - l.cy) * scale;
  }

  const start = onBase(lobes[0], -1);
  const end = onBase(lobes[lobes.length - 1], 1);
  let silhouette = `M${f(start.x)} ${f(start.y)}`;
  let from = start;
  lobes.forEach((l, i) => {
    const to = i < lobes.length - 1 ? valley(l, lobes[i + 1]) : end;
    silhouette += ` ${arcTo(l, from, to)}`;
    from = to;
  });
  silhouette += ` L${f(start.x)} ${f(BASE)} Z`;

  // A curl in every lobe, winding inward from its upper-left edge.
  const spirals = lobes.map((l) => {
    const pts: string[] = [];
    const turns = 1.15 + rand() * 0.35;
    for (let k = 0; k <= 48; k++) {
      const t = k / 48;
      const a = ((200 + t * turns * 360) * Math.PI) / 180;
      const r = l.r * (0.74 - t * 0.56);
      pts.push(`${k ? "L" : "M"}${f(l.cx + r * Math.cos(a))} ${f(l.cy + 4 + r * Math.sin(a))}`);
    }
    return pts.join("");
  });

  // The trailing wisp, rising slightly as it thins out.
  const tip = { x: Math.max(10, start.x - (110 + rand() * 50)), y: BASE - 26 - rand() * 14 };
  const tail =
    `M${f(start.x + 6)} ${f(BASE)}` +
    ` Q${f((start.x + tip.x) / 2)} ${f(BASE + 8)} ${f(tip.x)} ${f(tip.y)}` +
    ` Q${f((start.x + tip.x) / 2 + 14)} ${f(BASE - 14)} ${f(start.x + 14)} ${f(BASE - 20)} Z`;

  const band = `M${f(start.x + 18)} ${f(BASE - 9)} L${f(end.x - 14)} ${f(BASE - 9)}`;
  return { silhouette, spirals, tail, band };
}

export function TraditionalCloud({
  seed,
  lobes = 4,
  flip = false,
  className = "",
  style,
}: {
  seed: number;
  lobes?: number;
  flip?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const c = buildCloud(seed, lobes);
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      style={{ ...style, transform: flip ? "scaleX(-1)" : undefined }}
      fill="var(--cloud-fill)"
      stroke="var(--cloud-line)"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={c.tail} />
      <path d={c.silhouette} />
      <path d={c.band} fill="none" strokeWidth={2} />
      {c.spirals.map((d, i) => (
        <path key={i} d={d} fill="none" strokeWidth={2.2} />
      ))}
    </svg>
  );
}
