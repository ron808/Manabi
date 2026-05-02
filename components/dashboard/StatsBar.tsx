export function StatsBar({
  totalPapers,
  totalQuestions,
  accuracy,
}: {
  totalPapers: number;
  totalQuestions: number;
  accuracy: number;
}) {
  const stats = [
    { label: "Papers", longLabel: "Papers taken", value: totalPapers },
    { label: "Accuracy", longLabel: "Avg accuracy", value: `${accuracy}%` },
    { label: "Questions", longLabel: "Questions answered", value: totalQuestions },
  ];
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="card rounded-2xl px-3 py-3.5 sm:px-6 sm:py-5"
        >
          <div className="truncate text-[10px] uppercase tracking-wider text-white/45 sm:text-xs">
            <span className="sm:hidden">{s.label}</span>
            <span className="hidden sm:inline">{s.longLabel}</span>
          </div>
          <div className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
