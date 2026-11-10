"use client";

import { useEffect, useMemo, useState } from "react";
import { Crosshair, Flame, PenLine, Timer } from "lucide-react";
import {
  DIFFICULTY,
  LEVELS,
  LEVEL_INFO,
  SECTIONS,
  defaultFormats,
  formatsForLevel,
  type Level,
} from "@/lib/domain/jlpt";
import type { PaperMode } from "@/lib/domain/question";
import { QUESTION_COUNTS } from "@/lib/validation/schemas";
import { useGenerate } from "./useGenerate";

export function NewPaperForm({
  initialLevel,
  weakPoints,
}: {
  initialLevel: Level;
  weakPoints: string[];
}) {
  const { start, overlay, busy } = useGenerate();
  const [level, setLevel] = useState<Level>(initialLevel);
  const [mode, setMode] = useState<PaperMode>("practice");
  const [formats, setFormats] = useState<string[]>(() => defaultFormats(initialLevel));
  const [difficulty, setDifficulty] = useState(3);
  const [count, setCount] = useState(10);
  const [timed, setTimed] = useState(false);
  const [minutes, setMinutes] = useState(15);
  const [notes, setNotes] = useState("");

  const available = useMemo(() => formatsForLevel(level), [level]);
  const availableIds = useMemo(() => new Set(available.map((f) => f.id)), [available]);

  // Changing level drops formats that don't exist at that level.
  useEffect(() => {
    setFormats((fs) => {
      const kept = fs.filter((f) => availableIds.has(f));
      return kept.length ? kept : defaultFormats(level);
    });
  }, [level, availableIds]);

  useEffect(() => {
    if (mode === "exam") {
      setTimed(true);
      setMinutes(Math.max(5, Math.round(count * 1.5)));
    }
  }, [mode, count]);

  const toggle = (id: string) =>
    setFormats((fs) => (fs.includes(id) ? fs.filter((f) => f !== id) : [...fs, id]));

  const toggleSection = (ids: string[]) =>
    setFormats((fs) => (ids.every((id) => fs.includes(id)) ? fs.filter((f) => !ids.includes(f)) : Array.from(new Set([...fs, ...ids]))));

  function mock() {
    setMode("exam");
    setFormats(available.filter((f) => f.section !== "recall").map((f) => f.id));
    setCount(20);
    setDifficulty(3);
    document.getElementById("paper-form")?.scrollIntoView({ behavior: "smooth" });
  }

  function write() {
    void start({
      kind: "custom",
      level,
      difficulty,
      formats,
      questionCount: count,
      timeLimitMinutes: timed ? minutes : null,
      customInstructions: notes,
      mode,
    });
  }

  const canWrite = formats.length > 0 && !busy;
  const diff = DIFFICULTY.find((d) => d.value === difficulty)!;

  return (
    <>
      {overlay}
      <section aria-label="Quick start" className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
        <Preset
          icon={<Flame size={18} aria-hidden />}
          title="Today's mix"
          body={weakPoints.length ? "10 questions aimed at what you've been missing." : "10 questions at your level, tuned as you go."}
          onClick={() => void start({ kind: "daily" }, "Writing today's mix")}
          disabled={busy}
        />
        <Preset
          icon={<Crosshair size={18} aria-hidden />}
          title="Weak spots"
          body={
            weakPoints.length
              ? `Drill ${weakPoints.slice(0, 2).join(", ")}${weakPoints.length > 2 ? "…" : ""}`
              : "Unlocks after your first paper — Manabi needs to see what trips you up."
          }
          onClick={() => void start({ kind: "weak_spots", level }, "Writing a weak-spot drill")}
          disabled={busy || !weakPoints.length}
        />
        <Preset
          icon={<Timer size={18} aria-hidden />}
          title="Mock exam"
          body="Every question type at your level, timed, marked at the end."
          onClick={mock}
          disabled={busy}
        />
      </section>

      <div id="paper-form" className="mt-10 space-y-10 pb-32">
        <Field title="Level">
          <div role="radiogroup" aria-label="Level" className="grid grid-cols-5 gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={level === l}
                onClick={() => setLevel(l)}
                className={`flex min-h-[64px] flex-col items-center justify-center rounded-md text-lg font-semibold tabular transition-colors ${
                  level === l ? "bg-ink text-ground" : "bg-surface shadow-[inset_0_0_0_1px_rgb(var(--line)/0.12)] hover:shadow-[inset_0_0_0_1px_rgb(var(--line)/0.3)]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink/60">
            {LEVEL_INFO[level].blurb} · {LEVEL_INFO[level].words}
          </p>
        </Field>

        <Field title="How it's marked">
          <div role="radiogroup" aria-label="Mode" className="grid gap-2 sm:grid-cols-2">
            <ModeCard
              on={mode === "practice"}
              onClick={() => setMode("practice")}
              title="Practice"
              body="Marked as you go, with an explanation after every answer."
            />
            <ModeCard
              on={mode === "exam"}
              onClick={() => setMode("exam")}
              title="Exam"
              body="Like test day: change answers freely, marked when you hand in."
            />
          </div>
        </Field>

        <Field title="Question types" hint={`${formats.length} selected`}>
          <div className="space-y-5">
            {SECTIONS.map((s) => {
              const items = available.filter((f) => f.section === s.id);
              if (!items.length) return null;
              const ids = items.map((f) => f.id);
              const all = ids.every((id) => formats.includes(id));
              return (
                <div key={s.id}>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium">
                      {s.label} <span className="jp-sans ml-1 text-ink/40">{s.jp}</span>
                    </p>
                    <button type="button" onClick={() => toggleSection(ids)} className="text-xs text-ink/55 hover:text-ink">
                      {all ? "Clear" : "All"}
                    </button>
                  </div>
                  {s.note && <p className="-mt-1 mb-2 text-xs text-ink/50">{s.note}</p>}
                  <div className="flex flex-wrap gap-2">
                    {items.map((f) => (
                      <button key={f.id} type="button" onClick={() => toggle(f.id)} aria-pressed={formats.includes(f.id)} className="chip" title={f.jp}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Field>

        <Field title="Difficulty">
          <div role="radiogroup" aria-label="Difficulty" className="grid grid-cols-5 gap-2">
            {DIFFICULTY.map((d) => (
              <button
                key={d.value}
                type="button"
                role="radio"
                aria-checked={difficulty === d.value}
                onClick={() => setDifficulty(d.value)}
                className={`flex min-h-[64px] flex-col items-center justify-center gap-0.5 rounded-md transition-colors ${
                  difficulty === d.value ? "bg-ink text-ground" : "bg-surface shadow-[inset_0_0_0_1px_rgb(var(--line)/0.12)]"
                }`}
              >
                <span className="jp text-lg leading-none" aria-hidden>
                  {d.jp}
                </span>
                <span className="text-[11px] font-medium sm:text-xs">{d.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink/60">{diff.brief}</p>
        </Field>

        <Field title="Length">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Number of questions">
            {QUESTION_COUNTS.map((n) => (
              <button key={n} type="button" role="radio" aria-checked={count === n} onClick={() => setCount(n)} className="chip !min-w-[3.25rem] justify-center tabular">
                {n}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setTimed((t) => !t)} aria-pressed={timed} className="chip">
              <Timer size={15} aria-hidden /> {timed ? "Timed" : "No time limit"}
            </button>
            {timed && (
              <label className="flex items-center gap-2 text-sm text-ink/70">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={180}
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(1, Math.min(180, Number(e.target.value) || 1)))}
                  className="field !min-h-[40px] w-20 !py-2 tabular"
                  aria-label="Minutes"
                />
                minutes
              </label>
            )}
          </div>
        </Field>

        <Field title="Anything to focus on?" hint="Optional">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="Travel and train announcements, transitive vs intransitive verbs…"
            className="field resize-y"
            aria-label="Focus notes"
          />
          <p className="mt-1 text-right text-xs tabular text-ink/45">{notes.length}/500</p>
        </Field>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-30 border-t border-ink/10 bg-ground/92 backdrop-blur-md md:bottom-0">
        <div className="mx-auto flex max-w-page items-center justify-between gap-3 px-gutter py-3 md:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="min-w-0 truncate text-sm text-ink/65">
            <span className="font-medium text-ink">{level}</span> · {mode === "exam" ? "Exam" : "Practice"} · {count} questions
            {timed ? ` · ${minutes} min` : ""}
          </p>
          <button type="button" onClick={write} disabled={!canWrite} className="btn btn-primary shrink-0">
            <PenLine size={16} aria-hidden /> Write paper
          </button>
        </div>
      </div>
    </>
  );
}

function Field({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-lg">{title}</h2>
        {hint && <span className="text-sm text-ink/50">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function ModeCard({ on, onClick, title, body }: { on: boolean; onClick: () => void; title: string; body: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`rounded-md p-4 text-left transition-colors ${
        on ? "bg-surface shadow-[inset_0_0_0_2px_rgb(var(--ink))]" : "bg-surface shadow-[inset_0_0_0_1px_rgb(var(--line)/0.12)]"
      }`}
    >
      <span className="flex items-center gap-2 font-semibold">
        <span
          aria-hidden
          className={`grid h-4 w-4 place-items-center rounded-full ${on ? "bg-ink" : "shadow-[inset_0_0_0_1.5px_rgb(var(--line)/0.4)]"}`}
        >
          {on && <span className="h-1.5 w-1.5 rounded-full bg-ground" />}
        </span>
        {title}
      </span>
      <span className="mt-1 block text-sm text-ink/65">{body}</span>
    </button>
  );
}

function Preset({
  icon,
  title,
  body,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="panel group flex items-start gap-3 p-3.5 text-left transition-shadow disabled:cursor-not-allowed disabled:opacity-55 enabled:hover:shadow-[0_0_0_1px_rgb(var(--line)/0.3)] sm:flex-col sm:gap-2 sm:p-4"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent-ink">{icon}</span>
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        <span className="mt-0.5 line-clamp-2 block text-sm text-ink/65">{body}</span>
      </span>
    </button>
  );
}
