/** 18 weeks of study, one square per day, darker = more done. */
export function Heatmap({ days }: { days: { day: string; count: number }[] }) {
  // Pad the front so columns are whole weeks ending today.
  const columns: { day: string; count: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) columns.push(days.slice(i, i + 7));
  const active = days.filter((d) => d.count > 0).length;
  const shade = (n: number) =>
    n === 0 ? "bg-ink/[0.07]" : n < 10 ? "bg-accent/30" : n < 25 ? "bg-accent/55" : n < 50 ? "bg-accent/80" : "bg-accent";

  return (
    <figure>
      <div
        role="img"
        aria-label={`${active} active days in the last ${columns.length} weeks`}
        className="flex gap-[3px]"
      >
        {columns.map((week, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {week.map((d) => (
              <span
                key={d.day}
                title={`${d.day}: ${d.count} ${d.count === 1 ? "question" : "questions"}`}
                className={`h-[clamp(10px,2.6vw,15px)] w-[clamp(10px,2.6vw,15px)] rounded-[3px] ${shade(d.count)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <figcaption className="mt-2 flex items-center justify-between text-xs text-ink/50">
        <span>{active} active days</span>
        <span className="flex items-center gap-1" aria-hidden>
          Less
          <span className="h-2.5 w-2.5 rounded-[2px] bg-ink/[0.07]" />
          <span className="h-2.5 w-2.5 rounded-[2px] bg-accent/30" />
          <span className="h-2.5 w-2.5 rounded-[2px] bg-accent/55" />
          <span className="h-2.5 w-2.5 rounded-[2px] bg-accent" />
          More
        </span>
      </figcaption>
    </figure>
  );
}
