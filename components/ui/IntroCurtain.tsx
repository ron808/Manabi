import { CLOUD_BANDS, CLOUD_COPY_BOTTOM, CLOUD_COPY_TOP, CLOUD_EDGE } from "@/lib/ui/clouds";
import { CloudLayerFill } from "./CloudLayer";
import { Seal } from "./Seal";

/**
 * First load: the page opens under the stacked clouds, which fall away
 * top-first almost at once. Pure CSS (see .intro-curtain in globals.css) —
 * it never waits on JavaScript, never blocks clicks, and is skipped for
 * reduced motion.
 */
export function IntroCurtain() {
  return (
    <div className="intro-curtain" aria-hidden>
      {CLOUD_BANDS.map((b, i) => (
        <div
          key={i}
          className="intro-band"
          style={
            {
              top: b.stop === 0 ? `-${CLOUD_EDGE}px` : `${b.stop * 100}svh`,
              "--delay": `${0.32 + i * 0.06}s`,
            } as React.CSSProperties
          }
        >
          <CloudLayerFill color={b.color} bump={b.bump} seed={b.seed} />
        </div>
      ))}
      <div
        className="intro-copy absolute inset-x-0 grid place-items-center"
        style={{ top: `${CLOUD_COPY_TOP * 100}%`, bottom: `${(1 - CLOUD_COPY_BOTTOM) * 100}%` }}
      >
        <div className="rounded-[12px] bg-on-accent p-1.5 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.35)]">
          <Seal size={40} />
        </div>
      </div>
    </div>
  );
}
