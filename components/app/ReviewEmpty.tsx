"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useGenerate } from "./useGenerate";

export function ReviewEmpty() {
  const { start, overlay, busy } = useGenerate();
  return (
    <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
      {overlay}
      <button type="button" disabled={busy} onClick={() => void start({ kind: "daily" }, "Writing today's mix")} className="btn btn-primary">
        Ten new questions <ArrowRight size={16} aria-hidden />
      </button>
      <Link href="/new" className="btn btn-quiet">
        Choose a paper
      </Link>
    </div>
  );
}
