"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { applyTheme, readTheme } from "@/lib/ui/theme";

type Mode = "paper" | "sumi";

function effectiveMode(): Mode {
  const choice = readTheme();
  if (choice !== "system") return choice;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "sumi" : "paper";
}

/**
 * One tap flips between Paper (light) and Sumi (dark). The new theme spreads
 * out from the button in a circle where the browser supports view
 * transitions; elsewhere it simply switches.
 */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    setMode(effectiveMode());
    // While the choice is still "system", follow the OS if it changes.
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => readTheme() === "system" && setMode(effectiveMode());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const next: Mode = (mode ?? effectiveMode()) === "sumi" ? "paper" : "sumi";
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!doc.startViewTransition || reduce) {
      applyTheme(next);
      setMode(next);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const root = document.documentElement;
    root.style.setProperty("--vt-x", `${x}px`);
    root.style.setProperty("--vt-y", `${y}px`);
    root.style.setProperty("--vt-r", `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`);
    root.dataset.vt = "theme";
    const t = doc.startViewTransition(() => {
      applyTheme(next);
      setMode(next);
    });
    t.finished.finally(() => delete root.dataset.vt);
  }

  const dark = mode === "sumi";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light" : "Dark"}
      className="btn btn-ghost btn-sm relative !min-h-[40px] !w-10 !px-0"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {mode && (
          <motion.span
            key={mode}
            initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="grid place-items-center"
            aria-hidden
          >
            {dark ? <Moon size={18} strokeWidth={1.8} /> : <Sun size={18} strokeWidth={1.8} />}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
