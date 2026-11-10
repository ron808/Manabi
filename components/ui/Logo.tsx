import Link from "next/link";
import { Seal } from "./Seal";

export function Logo({ href = "/", size = 28 }: { href?: string | null; size?: number }) {
  const inner = (
    <span className="flex items-center gap-2.5">
      <Seal size={size} />
      <span className="text-[1.05rem] font-semibold tracking-[-0.03em]">Manabi</span>
    </span>
  );
  if (!href) return inner;
  return (
    <Link href={href} className="inline-flex items-center rounded-md" aria-label="Manabi home">
      {inner}
    </Link>
  );
}
