// The syllabus: JLPT levels and the official question types (問題 / mondai)
// per section, plus Manabi's own typed-recall drills. Source for the mondai
// list and section timings: jlpt.jp test-section guidelines.

export const LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
export type Level = (typeof LEVELS)[number];

export function isLevel(v: unknown): v is Level {
  return typeof v === "string" && (LEVELS as readonly string[]).includes(v);
}

export const LEVEL_INFO: Record<Level, { blurb: string; words: string }> = {
  N5: { blurb: "Basic phrases, hiragana, everyday kanji", words: "~800 words" },
  N4: { blurb: "Everyday topics, simple conversations", words: "~1,500 words" },
  N3: { blurb: "Daily life at natural speed", words: "~3,750 words" },
  N2: { blurb: "News, essays, workplace Japanese", words: "~6,000 words" },
  N1: { blurb: "Abstract, complex, native-level text", words: "~10,000 words" },
};

export type Section = "vocabulary" | "grammar" | "reading" | "listening" | "recall";

export const SECTIONS: { id: Section; label: string; jp: string; note?: string }[] = [
  { id: "vocabulary", label: "Vocabulary", jp: "文字・語彙" },
  { id: "grammar", label: "Grammar", jp: "文法" },
  { id: "reading", label: "Reading", jp: "読解" },
  { id: "listening", label: "Listening", jp: "聴解" },
  { id: "recall", label: "Recall", jp: "書く", note: "Type the answer — not on the JLPT, but it makes things stick." },
];

export type PointKind = "vocab" | "kanji" | "grammar" | "reading" | "listening";

export interface FormatDef {
  id: string;
  section: Section;
  label: string;
  jp: string;
  kind: PointKind;
  answer: "choice" | "typed";
  /** Lowest and highest level the format appears at on the real test. */
  levels: [Level, Level];
  /** Brief for the question writer. */
  brief: string;
  /** Typed answers in this format test the script itself — don't fold katakana. */
  keepScript?: boolean;
}

export const FORMATS: FormatDef[] = [
  {
    id: "kanji_reading",
    section: "vocabulary",
    label: "Kanji reading",
    jp: "漢字読み",
    kind: "kanji",
    answer: "choice",
    levels: ["N5", "N1"],
    brief:
      "A sentence with one kanji word wrapped in 【】. Ask how it is read. Options are four hiragana readings that differ by realistic confusions (long/short vowels, voicing, small っ, on/kun). Never put furigana on the 【】 word.",
  },
  {
    id: "orthography",
    section: "vocabulary",
    label: "Orthography",
    jp: "表記",
    kind: "kanji",
    answer: "choice",
    levels: ["N5", "N2"],
    brief:
      "A sentence with one word written in hiragana inside 【】. Ask how it is written. Options are four kanji/katakana spellings with plausible look-alike or sound-alike characters. Never put furigana on the options.",
  },
  {
    id: "word_formation",
    section: "vocabulary",
    label: "Word formation",
    jp: "語形成",
    kind: "vocab",
    answer: "choice",
    levels: ["N2", "N2"],
    brief: "A sentence with a blank for a prefix or suffix (e.g. 〜化, 再〜, 〜的). Four affix options.",
  },
  {
    id: "context",
    section: "vocabulary",
    label: "Word in context",
    jp: "文脈規定",
    kind: "vocab",
    answer: "choice",
    levels: ["N5", "N1"],
    brief: "A sentence with a （　　） blank. Four words of the same part of speech; exactly one fits the context.",
  },
  {
    id: "paraphrase",
    section: "vocabulary",
    label: "Paraphrase",
    jp: "言い換え類義",
    kind: "vocab",
    answer: "choice",
    levels: ["N5", "N1"],
    brief: "A sentence with a word or phrase in 【】. Ask which option means the closest thing. Options are full sentences or phrases.",
  },
  {
    id: "usage",
    section: "vocabulary",
    label: "Usage",
    jp: "用法",
    kind: "vocab",
    answer: "choice",
    levels: ["N4", "N1"],
    brief: "Give one target word as the question. Options are four sentences that all use it; exactly one uses it correctly.",
  },
  {
    id: "grammar_form",
    section: "grammar",
    label: "Grammar form",
    jp: "文法形式の判断",
    kind: "grammar",
    answer: "choice",
    levels: ["N5", "N1"],
    brief: "A sentence with a （　　） blank for a particle, conjugation or grammar pattern. Four options; exactly one is grammatical and natural.",
  },
  {
    id: "sentence_order",
    section: "grammar",
    label: "Sentence order ★",
    jp: "文の組み立て",
    kind: "grammar",
    answer: "choice",
    levels: ["N5", "N1"],
    brief:
      "A sentence with four blanks written ＿＿＿ and one of them marked ＿★＿. The four options are the fragments that fill the blanks in some order. The answer is the fragment that goes in the ★ position when the sentence is correct. Put the full correct sentence in the explanation.",
  },
  {
    id: "text_grammar",
    section: "grammar",
    label: "Grammar in a passage",
    jp: "文章の文法",
    kind: "grammar",
    answer: "choice",
    levels: ["N5", "N1"],
    brief: "A short passage (3–6 sentences) with one blank marked （　　）. Ask which option best fills it given the flow of the passage.",
  },
  {
    id: "reading_short",
    section: "reading",
    label: "Short passage",
    jp: "内容理解（短文）",
    kind: "reading",
    answer: "choice",
    levels: ["N5", "N1"],
    brief: "A short passage (memo, notice, email, 80–200 characters for N5–N4, up to 250 for N1). One comprehension question.",
  },
  {
    id: "reading_mid",
    section: "reading",
    label: "Mid passage",
    jp: "内容理解（中文）",
    kind: "reading",
    answer: "choice",
    levels: ["N5", "N1"],
    brief: "A passage of 250–450 characters (shorter for N5–N4). One question on the writer's reasoning, a cause, or what a phrase refers to.",
  },
  {
    id: "info_retrieval",
    section: "reading",
    label: "Find the information",
    jp: "情報検索",
    kind: "reading",
    answer: "choice",
    levels: ["N5", "N1"],
    brief: "A notice, timetable, price list or poster rendered as plain lines of text. A question that requires finding and combining two details.",
  },
  {
    id: "integrated_reading",
    section: "reading",
    label: "Compare two texts",
    jp: "統合理解",
    kind: "reading",
    answer: "choice",
    levels: ["N2", "N1"],
    brief: "Two short opinions labelled A and B on the same topic. Ask what both say, or how they differ.",
  },
  {
    id: "listening_task",
    section: "listening",
    label: "Task-based",
    jp: "課題理解",
    kind: "listening",
    answer: "choice",
    levels: ["N5", "N1"],
    brief:
      "A short dialogue (4–8 lines, speakers labelled 男： and 女：) in audioScript, where one person must decide what to do next. The question asks what they will do first. No passage text — the learner only hears it.",
  },
  {
    id: "listening_point",
    section: "listening",
    label: "Key point",
    jp: "ポイント理解",
    kind: "listening",
    answer: "choice",
    levels: ["N5", "N1"],
    brief:
      "A dialogue or monologue (4–8 lines, speakers labelled 男： / 女：) in audioScript. The question asks for a reason, a feeling or a specific detail.",
  },
  {
    id: "listening_summary",
    section: "listening",
    label: "Summary",
    jp: "概要理解",
    kind: "listening",
    answer: "choice",
    levels: ["N3", "N1"],
    brief: "A monologue (one speaker) in audioScript. The question asks what the speaker's main point is.",
  },
  {
    id: "listening_response",
    section: "listening",
    label: "Quick response",
    jp: "即時応答",
    kind: "listening",
    answer: "choice",
    levels: ["N5", "N1"],
    brief:
      "audioScript is a single line someone says to you. The question asks for the best reply; the four options are short replies in Japanese.",
  },
  {
    id: "recall_reading",
    section: "recall",
    label: "Write the reading",
    jp: "読みを書く",
    kind: "kanji",
    answer: "typed",
    levels: ["N5", "N1"],
    brief:
      "A sentence with one kanji word in 【】. The learner types its reading in hiragana. answerText is the reading in hiragana; acceptedAnswers lists any other valid readings. Never put furigana on the 【】 word.",
  },
  {
    id: "recall_form",
    section: "recall",
    label: "Conjugate it",
    jp: "活用",
    kind: "grammar",
    answer: "typed",
    levels: ["N5", "N2"],
    brief:
      "A sentence with a （　　） blank and the dictionary form of a verb or adjective given in 【】 after the sentence. The learner types the correctly conjugated form. answerText is in kana/kanji as normally written; acceptedAnswers includes the all-hiragana spelling.",
  },
];

export const FORMAT_BY_ID: Record<string, FormatDef> = Object.fromEntries(
  FORMATS.map((f) => [f.id, f])
);

const LEVEL_ORDER: Record<Level, number> = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 };

export function formatsForLevel(level: Level): FormatDef[] {
  return FORMATS.filter(
    (f) => LEVEL_ORDER[level] >= LEVEL_ORDER[f.levels[0]] && LEVEL_ORDER[level] <= LEVEL_ORDER[f.levels[1]]
  );
}

export function defaultFormats(level: Level): string[] {
  const core = ["kanji_reading", "context", "grammar_form", "sentence_order", "reading_short", "listening_point"];
  const allowed = new Set(formatsForLevel(level).map((f) => f.id));
  return core.filter((id) => allowed.has(id));
}

/** Official section times (minutes) — used for exam-mode defaults. */
export const OFFICIAL_MINUTES: Record<Level, { language: number; listening: number }> = {
  N5: { language: 60, listening: 30 },
  N4: { language: 80, listening: 35 },
  N3: { language: 100, listening: 40 },
  N2: { language: 105, listening: 50 },
  N1: { language: 110, listening: 55 },
};

/** Old free-text formats (v1 papers) → new format ids. */
export const LEGACY_FORMAT_MAP: Record<string, string> = {
  Vocabulary: "context",
  "Kanji reading": "kanji_reading",
  "Particle fill-in-the-blank": "grammar_form",
  Grammar: "grammar_form",
  "Reading comprehension": "reading_short",
  "Listening comprehension": "listening_point",
};

export function sectionOfLegacyFormat(format: string): Section {
  const id = LEGACY_FORMAT_MAP[format];
  return id ? FORMAT_BY_ID[id].section : "vocabulary";
}

export const DIFFICULTY: { value: number; label: string; jp: string; brief: string }[] = [
  { value: 1, label: "Gentle", jp: "易", brief: "Common words, clear distractors, short sentences." },
  { value: 2, label: "Easy", jp: "楽", brief: "Mostly common items with one tricky distractor." },
  { value: 3, label: "Real test", jp: "中", brief: "Pitched like the actual exam at this level." },
  { value: 4, label: "Hard", jp: "難", brief: "Less common items, close distractors, denser text." },
  { value: 5, label: "Brutal", jp: "鬼", brief: "Top of the level. Traps everywhere." },
];
