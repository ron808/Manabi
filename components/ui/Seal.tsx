// The brand mark: a vermilion hanko (判子) seal. Used in three places only —
// the logo, the favicon, and the stamp on a finished paper.

export function Seal({
  char = "学",
  size = 32,
  className = "",
  title,
}: {
  char?: string;
  size?: number;
  className?: string;
  title?: string;
}) {
  const big = char.length > 1;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={`shrink-0 -rotate-3 ${className}`}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {/* Slightly uneven edge, like stone pressed into ink. */}
      <path
        d="M6.2 4.6C12 3.6 28.4 3.4 34.1 4.4c1.6.3 2 1.1 2.1 2.4.6 8 .5 18.6-.2 26.4-.1 1.4-.8 2.1-2.2 2.3-7.3.9-19.5 1-27.4.2-1.5-.2-2.2-.9-2.3-2.4C3.4 25.9 3.5 14.4 4 6.9c.1-1.3.8-2.1 2.2-2.3Z"
        fill="rgb(var(--accent))"
      />
      <text
        x="20"
        y={big ? 24.5 : 27.6}
        textAnchor="middle"
        fontSize={big ? 13 : 21}
        fontWeight={600}
        fill="rgb(var(--on-accent))"
        style={{ fontFamily: "var(--font-jp-serif), serif" }}
      >
        {char}
      </text>
    </svg>
  );
}
