import { ApiError } from "@/lib/api/errors";
import { GenerationError, generateQuestions, type Progress } from "@/lib/ai/generate";
import type { PaperConfig, PaperSource } from "@/lib/db/models/Paper";
import {
  FORMAT_BY_ID,
  LEGACY_FORMAT_MAP,
  defaultFormats,
  formatsForLevel,
  isLevel,
  type Level,
  type PointKind,
} from "@/lib/domain/jlpt";
import type { PaperMode } from "@/lib/domain/question";
import type { GenerateRequest } from "@/lib/validation/schemas";
import { createPaper, getPaperDoc } from "./papers";
import type { CurrentUser } from "./session";
import { adaptiveDifficulty, weakestPoints, workingLevel } from "./stats";

interface Plan {
  mode: PaperMode;
  source: PaperSource;
  config: PaperConfig;
}

// Which formats best re-test each kind of learning point.
const FORMATS_FOR_KIND: Record<PointKind, string[]> = {
  grammar: ["grammar_form", "sentence_order", "recall_form"],
  vocab: ["context", "paraphrase", "usage"],
  kanji: ["kanji_reading", "orthography", "recall_reading"],
  reading: ["reading_short", "info_retrieval"],
  listening: ["listening_point", "listening_task"],
};

function formatsForPoints(level: Level, kinds: string[]): string[] {
  const allowed = new Set(formatsForLevel(level).map((f) => f.id));
  const out = new Set<string>();
  for (const k of kinds) for (const f of FORMATS_FOR_KIND[k as PointKind] ?? []) if (allowed.has(f)) out.add(f);
  return out.size ? Array.from(out) : defaultFormats(level);
}

async function weakSpotPlan(
  user: CurrentUser,
  opts: { level?: Level; questionCount?: number; mode?: PaperMode },
  source: PaperSource
): Promise<Plan> {
  const level = opts.level ?? (await workingLevel(user));
  let weak = await weakestPoints(user, 8, level);
  if (!weak.length) weak = await weakestPoints(user, 8);
  const difficulty = await adaptiveDifficulty(user, level);
  return {
    mode: opts.mode ?? "practice",
    source,
    config: {
      level,
      difficulty,
      formats: weak.length ? formatsForPoints(level, weak.map((w) => w.kind)) : defaultFormats(level),
      customInstructions: "",
      questionCount: opts.questionCount ?? 10,
      timeLimitMinutes: null,
      focusPoints: weak.map((w) => w.label),
    },
  };
}

export async function planPaper(user: CurrentUser, req: GenerateRequest): Promise<Plan> {
  switch (req.kind) {
    case "custom": {
      const allowed = new Set(formatsForLevel(req.level).map((f) => f.id));
      const formats = req.formats.filter((f) => allowed.has(f));
      if (!formats.length) throw new ApiError("bad_request", `None of those question types appear at ${req.level}.`);
      return {
        mode: req.mode,
        source: "custom",
        config: {
          level: req.level,
          difficulty: req.difficulty,
          formats,
          customInstructions: req.customInstructions,
          questionCount: req.questionCount,
          timeLimitMinutes: req.timeLimitMinutes,
          focusPoints: [],
        },
      };
    }
    case "weak_spots":
      return weakSpotPlan(user, req, "weak_spots");
    case "daily":
      return weakSpotPlan(user, { questionCount: 10 }, "daily");
    case "regenerate": {
      const from = await getPaperDoc(user, req.fromPaperId);
      if (!from) throw new ApiError("not_found", "That paper doesn't exist.");
      const level: Level = isLevel(from.config.level) ? from.config.level : "N5";
      // v1 papers stored free-text formats; map what we can, fold the rest into the brief.
      const mapped = from.config.formats.map((f) => (FORMAT_BY_ID[f] ? f : LEGACY_FORMAT_MAP[f])).filter(Boolean);
      const unknown = from.config.formats.filter((f) => !FORMAT_BY_ID[f] && !LEGACY_FORMAT_MAP[f]);
      const brief = [from.config.customInstructions, unknown.length ? `Also include: ${unknown.join(", ")}` : ""]
        .filter(Boolean)
        .join(" ")
        .slice(0, 500);
      return {
        mode: from.mode,
        source: "regenerate",
        config: {
          level,
          difficulty: Math.min(5, Math.max(1, from.config.difficulty)),
          formats: mapped.length ? Array.from(new Set(mapped)) : defaultFormats(level),
          customInstructions: brief,
          questionCount: Math.min(30, Math.max(5, from.config.questionCount)),
          timeLimitMinutes: from.config.timeLimitMinutes,
          focusPoints: [],
        },
      };
    }
  }
}

export async function generatePaper(user: CurrentUser, plan: Plan, onProgress: (p: Progress) => void) {
  const level = plan.config.level as Level;
  try {
    const questions = await generateQuestions(
      {
        level,
        difficulty: plan.config.difficulty,
        formats: plan.config.formats,
        questionCount: plan.config.questionCount,
        customInstructions: plan.config.customInstructions,
        focusPoints: plan.config.focusPoints,
      },
      onProgress
    );
    return createPaper(user, { ...plan, questions });
  } catch (err) {
    if (err instanceof GenerationError) {
      console.error("[manabi] generation failed", err.message);
      throw new ApiError("generation_failed", "The paper didn't come out right. Try again — it usually works the second time.");
    }
    throw err;
  }
}
