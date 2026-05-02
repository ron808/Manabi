"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export interface AnswerOptionsProps {
  options: string[] | null;
  locked: boolean;
  userAnswer: string | null;
  correctAnswer: string | null; // available after answer is locked
  onSubmit: (value: string) => void;
}

function letterOf(opt: string): string {
  // Options are like "A: ..."
  const m = opt.match(/^\s*([A-D])\s*[:：]/i);
  return m ? m[1].toUpperCase() : opt.charAt(0).toUpperCase();
}

function PendingDot() {
  return (
    <motion.span
      aria-hidden
      className="ml-auto inline-block h-2 w-2 rounded-full bg-brand-400"
      animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1.05, 0.85] }}
      transition={{ duration: 1.05, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function AnswerOptions({
  options,
  locked,
  userAnswer,
  correctAnswer,
  onSubmit,
}: AnswerOptionsProps) {
  const [text, setText] = useState(userAnswer ?? "");
  useEffect(() => {
    setText(userAnswer ?? "");
  }, [userAnswer]);

  const resolved = locked && !!correctAnswer;
  const pending = locked && !correctAnswer;

  if (options && options.length > 0) {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const letter = letterOf(opt);
          const optText = opt.replace(/^\s*[A-D]\s*[:：]\s*/i, "");
          const isUser = userAnswer?.toUpperCase() === letter;
          const isCorrect = correctAnswer?.toUpperCase() === letter;

          let cls =
            "group relative flex min-h-[60px] items-center gap-3 rounded-xl border p-3.5 text-left transition-colors duration-200 sm:p-4";
          if (!locked) {
            cls += " border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]";
          } else if (pending) {
            // Pending: highlight the user's selection in brand colors, dim the rest.
            // No red/green until the server confirms — kills the flash.
            cls += isUser
              ? " border-brand-500/55 bg-brand-500/15 text-white"
              : " border-white/10 bg-white/[0.02] text-white/45";
          } else if (resolved) {
            if (isCorrect)
              cls +=
                " border-emerald-400/45 bg-emerald-500/15 text-emerald-100";
            else if (isUser && !isCorrect)
              cls +=
                " border-sakura-500/45 bg-sakura-500/15 text-sakura-100";
            else cls += " border-white/10 bg-white/[0.02] text-white/50";
          }

          return (
            <motion.button
              key={letter}
              type="button"
              disabled={locked}
              onClick={() => onSubmit(letter)}
              whileTap={!locked ? { scale: 0.985 } : undefined}
              className={cls}
              layout
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border font-display font-semibold transition-colors ${
                  pending && isUser
                    ? "border-brand-400/60 bg-brand-500/30 text-white"
                    : resolved && isCorrect
                    ? "border-emerald-400/40 bg-emerald-500/25 text-emerald-50"
                    : resolved && isUser && !isCorrect
                    ? "border-sakura-500/40 bg-sakura-500/25 text-sakura-50"
                    : "border-white/10 bg-white/5 text-white/85"
                }`}
                aria-hidden
              >
                {letter}
              </span>
              <span className="jp min-w-0 flex-1 text-[15px] leading-snug sm:text-lg" lang="ja">
                {optText}
              </span>
              {pending && isUser && <PendingDot />}
            </motion.button>
          );
        })}
      </div>
    );
  }

  // Fill-in-the-blank
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (locked) return;
        const v = text.trim();
        if (!v) return;
        onSubmit(v);
      }}
      className="space-y-3"
    >
      <input
        type="text"
        lang="ja"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="日本語で入力…"
        disabled={locked}
        className="input jp text-lg disabled:opacity-70"
      />
      {!locked ? (
        <button
          type="submit"
          disabled={!text.trim()}
          className="btn btn-primary"
        >
          Submit answer
        </button>
      ) : pending ? (
        <div className="flex items-center gap-2 rounded-xl border border-brand-500/30 bg-brand-500/10 p-3 text-sm text-brand-200">
          <PendingDot /> Checking your answer…
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
          <span className="text-white/50">Correct answer: </span>
          <span className="jp text-emerald-200" lang="ja">
            {correctAnswer}
          </span>
        </div>
      )}
    </form>
  );
}
