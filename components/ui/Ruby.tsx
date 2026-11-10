import { Fragment } from "react";
import { parseRuby } from "@/lib/ja/ruby";

/**
 * Renders `{漢字|かんじ}` markup. With furigana off, readings are dropped and
 * only the base text shows — the markup never leaks into the page.
 */
export function Ruby({
  text,
  furigana,
  className,
  as: Tag = "span",
}: {
  text: string;
  furigana: boolean;
  className?: string;
  as?: "span" | "p" | "div";
}) {
  const segments = parseRuby(text);
  return (
    <Tag className={className} lang="ja">
      {segments.map((seg, i) =>
        seg.reading && furigana ? (
          <ruby key={i}>
            {seg.text}
            <rp>(</rp>
            <rt>{seg.reading}</rt>
            <rp>)</rp>
          </ruby>
        ) : (
          <Fragment key={i}>{seg.text}</Fragment>
        )
      )}
    </Tag>
  );
}
