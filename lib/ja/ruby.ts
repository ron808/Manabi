// Furigana markup used everywhere Japanese text is stored: `{漢字|かんじ}`.
// Compact for the model to write, trivial to parse, and degrades to readable
// text if a renderer ever ignores it.

export interface RubySegment {
  text: string;
  reading?: string;
}

const RUBY_RE = /\{([^{}|]+)\|([^{}|]+)\}/g;
const KANJI_RE = /[㐀-䶿一-鿿豈-﫿々〆ヵヶ]/;
const KANA_ONLY_RE = /^[ぁ-ゟ゠-ヿー・]+$/;

export function parseRuby(input: string): RubySegment[] {
  const out: RubySegment[] = [];
  let last = 0;
  for (const m of input.matchAll(RUBY_RE)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: input.slice(last, at) });
    out.push({ text: m[1], reading: m[2] });
    last = at + m[0].length;
  }
  if (last < input.length) out.push({ text: input.slice(last) });
  return out;
}

/** Base text only: `{駅|えき}に` → `駅に`. */
export function plainText(input: string): string {
  return input.replace(RUBY_RE, "$1");
}

/** Readings substituted in, for speech: `{駅|えき}に` → `えきに`. */
export function spokenText(input: string): string {
  return input.replace(RUBY_RE, "$2");
}

/**
 * Keeps only annotations that make sense — base contains kanji, reading is
 * pure kana — and removes stray braces the model may leave behind. A bad
 * reading is worse than none, so anything doubtful falls back to the base.
 */
export function sanitizeRuby(input: string): string {
  const cleaned = input.replace(RUBY_RE, (_all, base: string, reading: string) => {
    const r = reading.trim();
    if (KANJI_RE.test(base) && KANA_ONLY_RE.test(r) && r.length <= base.length * 6) {
      return `{${base}|${r}}`;
    }
    return base;
  });
  // Unpaired markup → strip the punctuation, keep the text.
  return cleaned.replace(/\{([^{}|]*)\}/g, "$1").replace(/[{}]/g, (c, i, s) =>
    isInsideRuby(s, i) ? c : ""
  );
}

function isInsideRuby(s: string, index: number): boolean {
  for (const m of s.matchAll(RUBY_RE)) {
    const at = m.index ?? 0;
    if (index >= at && index < at + m[0].length) return true;
  }
  return false;
}

export function hasKanji(input: string): boolean {
  return KANJI_RE.test(input);
}
