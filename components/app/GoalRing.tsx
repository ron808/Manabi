export function GoalRing({ done, goal, size = 96 }: { done: number; goal: number; size?: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, goal > 0 ? done / goal : 0);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${done} of ${goal} today`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(var(--ink) / 0.08)" strokeWidth="7" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="rgb(var(--accent))"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${c * p} ${c}`}
        transform="rotate(-90 50 50)"
        className="transition-[stroke-dasharray] duration-700"
      />
      <text x="50" y="49" textAnchor="middle" className="fill-ink" style={{ font: "600 22px var(--font-sans)" }}>
        {Math.min(done, 999)}
      </text>
      <text x="50" y="66" textAnchor="middle" className="fill-ink/50" style={{ font: "500 11px var(--font-sans)" }}>
        of {goal}
      </text>
    </svg>
  );
}
