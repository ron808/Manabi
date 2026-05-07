"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  DEFAULT_THEME,
  THEMES,
  THEME_STORAGE_KEY,
  isThemeId,
  type ThemeId,
} from "@/lib/themes";

function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute("data-theme", id);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // Storage may be blocked (private mode, etc.) — apply for the session anyway.
  }
}

function readStoredTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const fromAttr = document.documentElement.getAttribute("data-theme");
  if (isThemeId(fromAttr)) return fromAttr;
  try {
    const fromStorage = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(fromStorage)) return fromStorage;
  } catch {
    // ignore
  }
  return DEFAULT_THEME;
}

const PANEL_WIDTH = 300;
const PANEL_MARGIN = 8;

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ThemeId>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setActive(readStoredTheme());
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const t = triggerRef.current;
      if (!t) return;
      const rect = t.getBoundingClientRect();
      // Default: align the panel's right edge with the trigger's right edge.
      // Clamp into the viewport so it never overflows on either side.
      const desired = rect.right - PANEL_WIDTH;
      const maxLeft = window.innerWidth - PANEL_WIDTH - PANEL_MARGIN;
      const left = Math.max(PANEL_MARGIN, Math.min(desired, maxLeft));
      setCoords({ top: rect.bottom + PANEL_MARGIN, left });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(id: ThemeId) {
    applyTheme(id);
    setActive(id);
    setOpen(false);
  }

  const panel = (
    <AnimatePresence>
      {open && coords && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label="Theme picker"
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            width: PANEL_WIDTH,
            zIndex: 60,
          }}
          className="card origin-top-right rounded-2xl p-2 shadow-soft"
        >
          <div className="px-3 pb-2 pt-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">
              Theme
            </p>
            <p className="mt-0.5 text-xs text-white/55">
              Pick a palette — changes apply instantly.
            </p>
          </div>
          <ul className="space-y-1">
            {THEMES.map((t) => {
              const selected = t.id === active;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => pick(t.id)}
                    aria-pressed={selected}
                    className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      selected
                        ? "border-white/25 bg-white/[0.06]"
                        : "border-transparent hover:border-white/12 hover:bg-white/[0.04]"
                    }`}
                  >
                    <Swatches colors={t.swatches} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-white/90">
                          {t.name}
                        </span>
                        <span className="jp text-[11px] text-white/45" lang="ja">
                          {t.jp}
                        </span>
                      </span>
                      <span className="block truncate text-[11px] text-white/50">
                        {t.description}
                      </span>
                    </span>
                    {selected && (
                      <span
                        aria-hidden
                        className="text-[11px] font-semibold uppercase tracking-wider text-white/70"
                      >
                        ✓
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change color theme"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="btn btn-ghost !min-h-[40px] !px-3 !py-1.5 text-xs"
      >
        <PaletteIcon />
        <span className="hidden sm:inline">Theme</span>
      </button>
      {mounted && createPortal(panel, document.body)}
    </>
  );
}

function Swatches({ colors }: { colors: readonly [string, string, string] }) {
  return (
    <span
      className="relative inline-grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg ring-1 ring-white/10"
      aria-hidden
    >
      <span
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 55%, ${colors[2]} 100%)`,
        }}
      />
    </span>
  );
}

function PaletteIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 22a10 10 0 1 1 10-10c0 2.5-2 4-4.5 4H16a2 2 0 0 0-2 2v.5c0 1.93-1.07 3.5-3 3.5Z" />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" />
      <circle cx="16.5" cy="10.5" r="1" fill="currentColor" />
      <circle cx="8.5" cy="14.5" r="1" fill="currentColor" />
    </svg>
  );
}
