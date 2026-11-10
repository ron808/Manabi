/** Score % of recent completed papers, oldest → newest. */
export function ScoreTrend({ points }: { points: { pct: number; label: string }[] }) {
  if (points.length < 2) return null;
  const w = 600;
  const h = 120;
  const pad = 8;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (points.length - 1);
  const y = (p: number) => pad + ((100 - p) * (h - pad * 2)) / 100;
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.pct).toFixed(1)}`).join("");
  const avg = Math.round(points.reduce((a, p) => a + p.pct, 0) / points.length);
  const last = points[points.length - 1].pct;
  return (
    <figure className="panel p-5">
      <figcaption className="mb-3 flex items-baseline justify-between text-sm">
        <span className="font-medium">Last {points.length} papers</span>
        <span className="text-ink/60">
          Average <span className="tabular font-medium text-ink">{avg}%</span> · latest{" "}
          <span className="tabular font-medium text-ink">{last}%</span>
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-28 w-full" preserveAspectRatio="none" role="img" aria-label={`Scores trend, average ${avg}%`}>
        {[25, 50, 75].map((g) => (
          <line key={g} x1={0} x2={w} y1={y(g)} y2={y(g)} stroke="rgb(var(--ink) / 0.07)" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={d} fill="none" stroke="rgb(var(--accent))" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.pct)} r={3} fill="rgb(var(--surface))" stroke="rgb(var(--accent))" strokeWidth={1.5} vectorEffect="non-scaling-stroke">
            <title>{`${p.label}: ${p.pct}%`}</title>
          </circle>
        ))}
      </svg>
    </figure>
  );
}
