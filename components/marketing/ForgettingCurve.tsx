/**
 * Memory of one mistake over a month: it fades, a review lifts it back up,
 * and each time it fades more slowly — so reviews can spread out.
 * Drawn twice — a compact version for phones keeps the labels readable.
 */
function Curve({ W, H, compact }: { W: number; H: number; compact: boolean }) {
  const left = compact ? 28 : 36;
  const bottom = H - 40;
  const top = 26;
  const day = (W - left - 16) / 30;
  const reviews = [0, 1, 4, 12, 30];
  const stab = [0.9, 2.2, 6, 16];
  const y = (r: number) => bottom - r * (bottom - top);
  const font = (size: number) => ({ font: `500 ${size}px var(--font-sans)` });

  const paths: string[] = [];
  for (let i = 0; i < reviews.length - 1; i++) {
    const a = reviews[i];
    const b = reviews[i + 1];
    let d = "";
    for (let t = 0; t <= b - a + 0.001; t += 0.1) {
      d += `${t === 0 ? "M" : "L"}${(left + (a + t) * day).toFixed(1)} ${y(Math.exp(-t / stab[i])).toFixed(1)}`;
    }
    paths.push(d);
  }
  // Gap before each review, written under it. The mistake itself is the first dot.
  const gaps = compact ? ["", "1d", "3d", "8d"] : ["", "1 day", "3 days", "8 days"];

  return (
    <>
      <line x1={left} x2={W - 8} y1={bottom} y2={bottom} stroke="rgb(var(--ink) / 0.2)" />
      <line x1={left} x2={W - 8} y1={y(0.9)} y2={y(0.9)} stroke="rgb(var(--ink) / 0.14)" strokeDasharray="4 6" />
      <text x={W - 8} y={y(0.9) - 8} textAnchor="end" className="fill-ink/50" style={font(12)}>
        90% recall
      </text>
      <text x={left - 8} y={y(1) + 4} textAnchor="end" className="fill-ink/45" style={font(11)}>
        100
      </text>
      <text x={left - 8} y={bottom + 4} textAnchor="end" className="fill-ink/45" style={font(11)}>
        0
      </text>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="rgb(var(--ink))" strokeWidth={2} strokeLinecap="round" />
      ))}
      {reviews.slice(0, -1).map((r, i) => (
        <g key={r}>
          <line x1={left + r * day} x2={left + r * day} y1={y(1)} y2={bottom} stroke="rgb(var(--accent) / 0.35)" strokeDasharray="2 4" />
          <circle
            cx={left + r * day}
            cy={y(1)}
            r={6}
            fill={i === 0 ? "rgb(var(--surface))" : "rgb(var(--accent))"}
            stroke="rgb(var(--accent))"
            strokeWidth={2}
          />
          {gaps[i] && (
            <text x={left + r * day} y={bottom + 22} textAnchor="middle" className="fill-ink/70" style={font(12)}>
              {gaps[i]}
            </text>
          )}
        </g>
      ))}
      <text x={W - 8} y={bottom + 22} textAnchor="end" className="fill-ink/45" style={font(12)}>
        a month
      </text>
    </>
  );
}

export function ForgettingCurve() {
  return (
    <figure className="sheet p-5 sm:p-8">
      <svg viewBox="0 0 360 230" className="w-full sm:hidden" role="img" aria-labelledby="curve-title-s curve-desc">
        <title id="curve-title-s">How a mistake is reviewed</title>
        <Curve W={360} H={230} compact />
      </svg>
      <svg viewBox="0 0 720 260" className="hidden w-full sm:block" role="img" aria-labelledby="curve-title curve-desc">
        <title id="curve-title">How a mistake is reviewed</title>
        <desc id="curve-desc">
          Memory drops quickly after a mistake. Each review restores it, and it drops more slowly every time, so the
          gaps between reviews grow from one day to about three weeks.
        </desc>
        <Curve W={720} H={260} compact={false} />
      </svg>
      <figcaption className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink/60">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-accent" /> the mistake
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" /> a review
        </span>
        <span>Illustrative — real gaps adapt to how each answer felt.</span>
      </figcaption>
    </figure>
  );
}
