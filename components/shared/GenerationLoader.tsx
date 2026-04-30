"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const PHASES = [
  { jp: "生成中", en: "Drafting questions…" },
  { jp: "選択肢", en: "Picking distractors…" },
  { jp: "翻訳", en: "Polishing translations…" },
  { jp: "解説", en: "Writing explanations…" },
  { jp: "仕上げ", en: "Final touches…" },
];

function Shuriken() {
  return (
    <motion.svg
      width={96}
      height={96}
      viewBox="0 0 100 100"
      aria-hidden
      className="drop-shadow-[0_8px_32px_rgba(124,123,255,0.45)]"
      animate={{ rotate: 360 }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
    >
      <defs>
        <linearGradient id="shuriken-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C7C9FF" />
          <stop offset="55%" stopColor="#7c7bff" />
          <stop offset="100%" stopColor="#FF7AA8" />
        </linearGradient>
        <linearGradient id="shuriken-edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
        </linearGradient>
      </defs>
      {/* 4-point shuriken: two crossed concave blades */}
      <g transform="translate(50 50)">
        <path
          d="M0 -46 L10 -10 L46 0 L10 10 L0 46 L-10 10 L-46 0 L-10 -10 Z"
          fill="url(#shuriken-grad)"
          stroke="url(#shuriken-edge)"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <circle r={5} fill="#0B0F1A" stroke="rgba(255,255,255,0.5)" strokeWidth={1.2} />
      </g>
    </motion.svg>
  );
}

export function GenerationLoader({
  open,
  questionCount,
}: {
  open: boolean;
  questionCount?: number;
}) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!open) {
      setPhase(0);
      return;
    }
    const id = window.setInterval(() => {
      setPhase((p) => (p + 1) % PHASES.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="alertdialog"
          aria-live="assertive"
          aria-label="Generating paper"
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-ink-900/80 backdrop-blur-md" />
          {/* Soft aurora wash */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute inset-x-0 top-1/3 mx-auto h-72 w-72 rounded-full bg-gradient-to-br from-brand-500/30 via-sakura-500/15 to-transparent blur-3xl"
          />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md"
          >
            <div className="card rounded-3xl px-7 py-9 text-center shadow-soft sm:px-9 sm:py-11">
              <div className="mx-auto flex h-28 w-28 items-center justify-center">
                <Shuriken />
              </div>

              <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.24em] text-brand-400">
                {questionCount
                  ? `Crafting ${questionCount} questions`
                  : "Crafting your paper"}
              </p>

              <h2 className="mt-2 font-display text-3xl tracking-tight text-white sm:text-4xl">
                Generating…
              </h2>

              <div className="mt-5 min-h-[2.75rem]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={phase}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-center gap-1"
                  >
                    <span className="jp text-base text-white/85" lang="ja">
                      {PHASES[phase].jp}
                    </span>
                    <span className="text-sm text-white/55">
                      {PHASES[phase].en}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Indeterminate bar */}
              <div className="relative mt-6 h-1 w-full overflow-hidden rounded-full bg-white/8">
                <motion.span
                  className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-brand-400 to-sakura-400"
                  initial={{ x: "-50%" }}
                  animate={{ x: "200%" }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>

              <p className="mt-6 text-xs text-white/40">
                Usually takes 3–10 seconds. Please don&apos;t close this tab.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
