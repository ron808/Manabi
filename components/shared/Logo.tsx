import Link from "next/link";

export function Logo({
  size = "md",
  href = "/",
}: {
  size?: "sm" | "md" | "lg";
  href?: string | null;
}) {
  const dim = size === "sm" ? 24 : size === "lg" ? 36 : 28;
  const text =
    size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";

  const inner = (
    <span className="flex items-center gap-2.5">
      <span
        className="relative inline-grid place-items-center rounded-xl"
        style={{
          width: dim,
          height: dim,
          background: "linear-gradient(135deg,#5b53ee,#F0467F)",
          boxShadow: "0 6px 20px -8px rgba(91,83,238,.6)",
        }}
        aria-hidden
      >
        <span className="jp font-bold text-white" style={{ fontSize: dim * 0.5 }}>
          学
        </span>
      </span>
      <span className={`font-display font-semibold tracking-tight ${text}`}>
        Manabi
      </span>
    </span>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="inline-flex items-center hover:opacity-90">
      {inner}
    </Link>
  );
}
