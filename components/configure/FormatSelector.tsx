"use client";

import { useState } from "react";
import { ALL_FORMATS } from "@/lib/types";

export function FormatSelector({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const toggle = (f: string) => {
    onChange(
      value.includes(f) ? value.filter((x) => x !== f) : [...value, f]
    );
  };
  const remove = (f: string) => onChange(value.filter((x) => x !== f));

  const addCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const v = draft.trim();
    if (!v || value.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...value, v]);
    setDraft("");
  };

  const isCustom = (f: string) =>
    !ALL_FORMATS.includes(f);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {ALL_FORMATS.map((f) => {
          const active = value.includes(f);
          return (
            <button
              key={f}
              type="button"
              onClick={() => toggle(f)}
              data-active={active}
              className="pill"
            >
              {active && (
                <span className="text-[10px] text-brand-400">●</span>
              )}
              {f}
            </button>
          );
        })}
        {value.filter(isCustom).map((f) => (
          <span key={f} data-active className="pill">
            {f}
            <button
              type="button"
              onClick={() => remove(f)}
              aria-label={`Remove ${f}`}
              className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <form onSubmit={addCustom} className="mt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add custom format and press Enter"
          maxLength={80}
          className="input"
        />
      </form>
    </div>
  );
}
