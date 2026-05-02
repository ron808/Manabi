"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LevelSelector } from "@/components/configure/LevelSelector";
import { DifficultySlider } from "@/components/configure/DifficultySlider";
import { FormatSelector } from "@/components/configure/FormatSelector";
import { TestSettings } from "@/components/configure/TestSettings";
import { MotionPage, MotionItem } from "@/components/shared/Motion";
import { GenerationLoader } from "@/components/shared/GenerationLoader";
import { ALL_FORMATS } from "@/lib/types";
import type { Level } from "@/lib/types";

export default function ConfigurePage() {
  const router = useRouter();
  const [level, setLevel] = useState<Level>("N3");
  const [difficulty, setDifficulty] = useState(3);
  const [formats, setFormats] = useState<string[]>([...ALL_FORMATS]);
  const [questionCount, setQuestionCount] = useState(15);
  const [timeLimit, setTimeLimit] = useState<number | null>(20);
  const [customInstructions, setCustomInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customRequired = level === "Custom";
  const formatsValid = formats.length >= 1;
  const customValid = !customRequired || customInstructions.trim().length > 0;
  const canSubmit = formatsValid && customValid && !submitting;

  async function generate() {
    setError(null);
    if (!formatsValid) {
      setError("Select at least one question format.");
      return;
    }
    if (!customValid) {
      setError("Custom instructions are required when level = Custom.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/papers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          difficulty,
          formats,
          customInstructions,
          questionCount,
          timeLimitMinutes: timeLimit,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        throw new Error(j.message || j.error || "Failed to generate paper");
      }
      router.push(`/test/${j.paperId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate paper");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <GenerationLoader open={submitting} questionCount={questionCount} />
      <MotionPage className="space-y-6 pb-40 sm:space-y-10 sm:pb-32">
      <MotionItem>
        <header>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-brand-400">
            Step 01 — Configure
          </p>
          <h1 className="mt-1 break-words font-display text-3xl leading-[1.05] tracking-tighter2 sm:text-5xl md:text-6xl">
            Design your <span className="text-gradient">paper</span>
          </h1>
          <p className="mt-2 max-w-md text-[15px] leading-relaxed text-white/60">
            Tune every dimension. We&apos;ll generate the rest.
          </p>
        </header>
      </MotionItem>

      <Section title="Level" hint="Pick your JLPT level — or write a custom brief.">
        <LevelSelector value={level} onChange={setLevel} />
      </Section>

      <Section title="Difficulty" hint="How hard should the questions be?">
        <DifficultySlider value={difficulty} onChange={setDifficulty} />
      </Section>

      <Section
        title="Formats"
        hint="The paper will distribute these evenly. Add custom formats below."
      >
        <FormatSelector value={formats} onChange={setFormats} />
        {!formatsValid && (
          <p className="mt-2 text-xs text-sakura-300">
            Select at least one format.
          </p>
        )}
      </Section>

      <Section title="Test settings" hint="Length and time pressure.">
        <TestSettings
          questionCount={questionCount}
          onQuestionCount={setQuestionCount}
          timeLimit={timeLimit}
          onTimeLimit={setTimeLimit}
        />
      </Section>

      <Section
        title={customRequired ? "Custom instructions (required)" : "Custom instructions"}
        hint="Optional notes — focus on a topic, target weak spots, or set a scenario."
      >
        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value.slice(0, 500))}
          maxLength={500}
          rows={4}
          placeholder={
            customRequired
              ? "Describe the kind of paper you want…"
              : "Optional: e.g. focus on transitive vs intransitive verbs."
          }
          className="input min-h-[120px] resize-y"
        />
        <div className="mt-1 text-right text-[11px] text-white/40">
          {customInstructions.length} / 500
        </div>
      </Section>

      {/* Sticky Generate bar */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-white/8 bg-ink-900/90 pb-safe backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-stretch gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5">
          <div className="min-w-0 order-2 sm:order-1">
            {error ? (
              <p className="truncate text-sm text-sakura-300">{error}</p>
            ) : (
              <p className="truncate text-[11px] text-white/55 sm:text-xs">
                {level} · diff {difficulty} · {questionCount} Qs ·{" "}
                {timeLimit ? `${timeLimit} min` : "untimed"} · {formats.length} formats
              </p>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -1 }}
            onClick={generate}
            disabled={!canSubmit}
            className="btn btn-primary order-1 w-full sm:order-2 sm:w-auto"
          >
            {submitting ? (
              <>
                <Spinner /> Generating paper…
              </>
            ) : (
              <>Generate paper →</>
            )}
          </motion.button>
        </div>
      </motion.div>
      </MotionPage>
    </>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <MotionItem>
      <section className="card rounded-2xl p-4 sm:p-7">
        <div className="mb-4">
          <h2 className="font-display text-2xl tracking-tightish sm:text-3xl">
            {title}
          </h2>
          {hint && <p className="mt-1 text-sm text-white/55">{hint}</p>}
        </div>
        {children}
      </section>
    </MotionItem>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
      aria-hidden
    />
  );
}
