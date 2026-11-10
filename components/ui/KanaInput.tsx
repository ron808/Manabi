"use client";

import { useEffect, useRef, useState } from "react";
import { bind, unbind } from "wanakana";

const KANA_PREF = "manabi.kanaInput";

/**
 * Text field that turns romaji into hiragana as you type (`taberu` → たべる),
 * for learners without a Japanese keyboard. Can be switched off for people
 * who use a real IME. The preference is remembered on this device.
 */
export function KanaInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = "こたえ",
  autoFocus,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  id?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [kana, setKana] = useState(true);

  useEffect(() => {
    try {
      setKana(localStorage.getItem(KANA_PREF) !== "off");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !kana || disabled) return;
    bind(el, { IMEMode: "toHiragana" });
    return () => unbind(el);
  }, [kana, disabled]);

  function toggle() {
    const next = !kana;
    setKana(next);
    try {
      localStorage.setItem(KANA_PREF, next ? "on" : "off");
    } catch {
      // ignore
    }
    ref.current?.focus();
  }

  return (
    <div className="flex gap-2">
      <input
        ref={ref}
        id={id}
        type="text"
        lang="ja"
        value={value}
        // wanakana rewrites the DOM value before React sees the input event.
        onInput={(e) => onChange(e.currentTarget.value)}
        onChange={(e) => onChange(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onSubmit?.();
          }
        }}
        disabled={disabled}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className="field jp-sans flex-1 text-lg"
      />
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-pressed={kana}
        title={kana ? "Romaji turns into kana as you type" : "Typing is left as-is"}
        className="chip shrink-0 !rounded-md"
      >
        <span className="jp-sans">{kana ? "あ" : "A"}</span>
        <span className="sr-only">Romaji to kana</span>
      </button>
    </div>
  );
}
