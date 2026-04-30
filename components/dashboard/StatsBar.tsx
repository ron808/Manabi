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
    { label: "Papers taken", value: totalPapers },
    { label: "Avg accuracy", value: `${accuracy}%` },
    { label: "Questions answered", value: totalQuestions },
  ];
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {stats.map((s) => (
        <div key={s.label} className="card rounded-2xl px-4 py-4 sm:px-6 sm:py-5">
          <div className="text-xs uppercase tracking-wider text-white/45">
            {s.label}
          </div>
          <div className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
