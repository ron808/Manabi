"use client";

import { ALLOWED_LEVELS } from "@/lib/validation/schemas";

const HINTS: Record<string, string> = {
  Beginner: "Just starting out",
  N5: "~800 words · basic grammar",
  N4: "~1,500 words · everyday topics",
  N3: "Bridge level · daily life",
  N2: "News, fiction, business",
  N1: "Native-level fluency",
  Custom: "Your own brief",
};

export function LevelSelector({
  value,
  onChange,
}: {
  value: (typeof ALLOWED_LEVELS)[number];
  onChange: (v: (typeof ALLOWED_LEVELS)[number]) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {ALLOWED_LEVELS.map((lvl) => {
        const active = lvl === value;
        return (
          <button
            key={lvl}
            type="button"
            onClick={() => onChange(lvl)}
            data-active={active}
            className="pill flex-col !items-start !rounded-xl !px-3 !py-3 text-left"
          >
            <span className="text-sm font-semibold text-white">{lvl}</span>
            <span className="mt-0.5 text-[11px] text-white/50">
              {HINTS[lvl]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
