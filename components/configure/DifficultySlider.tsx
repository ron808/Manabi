"use client";

import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  {
    v: 1,
    label: "Very easy",
    short: "易",
    desc: "Gentle ramp. Forgiving distractors and short prompts.",
  },
  {
    v: 2,
    label: "Easy",
    short: "楽",
    desc: "Light pressure. Clear vocab, simple grammar.",
  },
  {
    v: 3,
    label: "Standard",
    short: "中",
    desc: "True-to-JLPT level. Balanced challenge across formats.",
  },
  {
    v: 4,
    label: "Hard",
    short: "難",
    desc: "Sharp distractors, rarer vocab, denser passages.",
  },
  {
    v: 5,
    label: "Brutal",
    short: "鬼",
    desc: "Top-of-level cruelty. Built to push your weak spots.",
  },
];

export function DifficultySlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const active = STEPS.find((s) => s.v === value) ?? STEPS[2];

  return (
    <div className="select-none">
      {/* Header: number + active label */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="flex items-baseline gap-3">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={value}
              initial={{ opacity: 0, y: 10, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.85 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-5xl font-semibold leading-none text-white sm:text-7xl"
            >
              {value}
            </motion.span>
          </AnimatePresence>
          <span className="text-base font-medium text-white/35 sm:text-lg">
            / 5
          </span>
          <span className="ml-auto sm:hidden">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={`label-${active.v}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                className="font-display text-lg font-semibold text-white"
              >
                {active.label}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>
        <div className="min-h-[2.5rem] sm:min-h-[2.75rem] sm:flex-1 sm:text-right">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={active.v}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              <div className="hidden font-display text-xl font-semibold tracking-tight text-white sm:block sm:text-2xl">
                {active.label}
              </div>
              <p className="text-xs leading-snug text-white/55 sm:mt-0.5 sm:text-sm">
                {active.desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Segmented stepper */}
      <div
        role="radiogroup"
        aria-label="Difficulty"
        className="relative grid grid-cols-5 gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-sm"
      >
        {STEPS.map((s) => {
          const isActive = s.v === value;
          return (
            <button
              key={s.v}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={s.label}
              onClick={() => onChange(s.v)}
              className="relative isolate flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 transition-colors sm:gap-1.5 sm:px-2 sm:py-3.5"
            >
              {isActive && (
                <motion.span
                  layoutId="difficulty-active"
                  className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-brand-500/35 via-brand-500/20 to-sakura-500/25 shadow-[inset_0_0_0_1px_rgba(124,123,255,0.55),0_8px_24px_-8px_rgba(79,70,229,0.55)]"
                  transition={{
                    type: "spring",
                    stiffness: 480,
                    damping: 38,
                    mass: 0.6,
                  }}
                />
              )}
              <span
                className={`jp text-base font-semibold transition-colors sm:text-lg ${
                  isActive ? "text-white" : "text-white/40"
                }`}
                lang="ja"
                aria-hidden
              >
                {s.short}
              </span>
              <span
                className={`truncate text-[9px] font-medium uppercase tracking-wider transition-colors sm:text-[11px] ${
                  isActive ? "text-white/90" : "text-white/45"
                }`}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Progress dots row */}
      <div className="mt-4 flex items-center gap-2">
        {STEPS.map((s) => {
          const reached = s.v <= value;
          return (
            <motion.span
              key={s.v}
              animate={{
                width: s.v === value ? 28 : 6,
                opacity: reached ? 1 : 0.25,
              }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`h-1.5 rounded-full ${
                reached
                  ? "bg-gradient-to-r from-brand-400 to-sakura-400"
                  : "bg-white/15"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
