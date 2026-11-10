import { CLOUD_EDGE, cloudPath } from "@/lib/ui/clouds";

/** One full-screen cloud layer. The panel starts inside the cloud edge so no seam can show. */
export function CloudLayerFill({ color, bump, seed }: { color: string; bump: number; seed: number }) {
  return (
    <>
      <div className="absolute inset-x-0 bottom-0 top-[64px]" style={{ background: color }} />
      <svg
        aria-hidden
        viewBox={`0 0 1200 ${CLOUD_EDGE}`}
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 block h-[80px] w-full"
        style={{ color }}
      >
        <path d={cloudPath(bump, seed)} fill="currentColor" />
      </svg>
    </>
  );
}
