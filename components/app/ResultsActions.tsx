"use client";

import Link from "next/link";
import { BookOpenCheck, Crosshair, RotateCcw } from "lucide-react";
import { useGenerate } from "./useGenerate";

export function ResultsActions({ paperId, toReview }: { paperId: string; toReview: number }) {
  const { start, overlay, busy } = useGenerate();
  return (
    <>
      {overlay}
      <div className="flex flex-wrap gap-2">
        {toReview > 0 && (
          <Link href="/review" className="btn btn-primary">
            <BookOpenCheck size={16} aria-hidden /> Review {toReview === 1 ? "it" : `these ${toReview}`} now
          </Link>
        )}
        {toReview > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void start({ kind: "weak_spots" }, "Writing a weak-spot drill")}
            className="btn btn-quiet"
          >
            <Crosshair size={16} aria-hidden /> Drill weak spots
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => void start({ kind: "regenerate", fromPaperId: paperId }, "Writing a similar paper")}
          className={`btn ${toReview > 0 ? "btn-ghost" : "btn-primary"}`}
        >
          <RotateCcw size={16} aria-hidden /> Similar paper
        </button>
      </div>
    </>
  );
}
