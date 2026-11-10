"use client";

import Link from "next/link";
import { ArrowRight, Crosshair } from "lucide-react";
import { useGenerate } from "./useGenerate";

/** The one big button on Today: due reviews first, otherwise a fresh mix. */
export function StartSession({ due }: { due: number }) {
  const { start, overlay, busy } = useGenerate();
  if (due > 0) {
    return (
      <Link href="/review" className="btn btn-primary w-full sm:w-auto">
        Start today&apos;s session <ArrowRight size={16} aria-hidden />
      </Link>
    );
  }
  return (
    <>
      {overlay}
      <button
        type="button"
        disabled={busy}
        onClick={() => void start({ kind: "daily" }, "Writing today's mix")}
        className="btn btn-primary w-full sm:w-auto"
      >
        Start today&apos;s session <ArrowRight size={16} aria-hidden />
      </button>
    </>
  );
}

export function DrillWeakSpots() {
  const { start, overlay, busy } = useGenerate();
  return (
    <>
      {overlay}
      <button
        type="button"
        disabled={busy}
        onClick={() => void start({ kind: "weak_spots" }, "Writing a weak-spot drill")}
        className="btn btn-quiet btn-sm"
      >
        <Crosshair size={15} aria-hidden /> Drill these
      </button>
    </>
  );
}
