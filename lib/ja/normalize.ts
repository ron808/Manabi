import { toHiragana } from "wanakana";
import { plainText } from "./ruby";

const JAPANESE_RE = /[぀-ヿ㐀-䶿一-鿿ｦ-ﾟ]/;

export function hasJapanese(input: string): boolean {
  return JAPANESE_RE.test(input);
}

/**
 * Canonical form for comparing typed answers:
 * NFKC (folds full-width / half-width), no whitespace (incl. 　), no
 * sentence punctuation, Latin lower-cased, katakana folded to hiragana.
 * `keepScript` skips the kana fold for questions that test the script itself
 * (表記 — "write it in katakana").
 */
export function normalizeAnswer(input: string, opts: { keepScript?: boolean } = {}): string {
  let s = plainText(input).normalize("NFKC").toLowerCase();
  s = s.replace(/[\s　]+/g, "");
  s = s.replace(/[。、．，.,!?！？「」『』（）()"'“”‘’]/g, "");
  if (!opts.keepScript) s = toHiragana(s, { passRomaji: true });
  return s;
}

export function answersMatch(
  given: string,
  expected: string,
  opts: { keepScript?: boolean; alternatives?: string[] } = {}
): boolean {
  const g = normalizeAnswer(given, opts);
  if (!g) return false;
  return [expected, ...(opts.alternatives ?? [])].some(
    (candidate) => normalizeAnswer(candidate, opts) === g
  );
}
