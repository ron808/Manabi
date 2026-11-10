"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CLOUD_BANDS, CLOUD_COPY_BOTTOM, CLOUD_COPY_TOP, CLOUD_EDGE } from "@/lib/ui/clouds";
import { LOADING_LINES, randomItem } from "@/lib/ui/loadingLines";
import { CloudLayerFill } from "./CloudLayer";
import { Seal } from "./Seal";

const EVENT = "manabi:navigate";

/** Call right before a programmatic router.push/replace so the clouds cover it. */
export function beginNavigation() {
  window.dispatchEvent(new Event(EVENT));
}

/** From the click to the moment the stack starts to fall (if the page is ready). */
const MIN_VISIBLE_MS = 850;
const GIVE_UP_MS = 12_000;
const RISE_STAGGER = 0.07;
const FALL_STAGGER = 0.06;
const FALL_MS = 380 + FALL_STAGGER * 1000 * (CLOUD_BANDS.length - 1) + 40;
const LAST = CLOUD_BANDS.length - 1;

type Phase = "idle" | "enter" | "up" | "fall";

/**
 * Every page change: cloud bands build up from the bottom (front band
 * first), the new page swaps in underneath, and the stack falls away from
 * the top. Driven by CSS transitions (.cloud-curtain in globals.css), so it
 * runs on the compositor and never depends on animation frames.
 */
export function NavCurtain() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const [line, setLine] = useState(LOADING_LINES[0]);
  const root = useRef<HTMLDivElement>(null);

  const pending = useRef(false);
  const shownAt = useRef(0);
  const timers = useRef<number[]>([]);
  const lastPath = useRef(pathname);

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const finish = useCallback(() => {
    pending.current = false;
    clear();
    if (!shownAt.current) return;
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current));
    timers.current.push(
      window.setTimeout(() => {
        shownAt.current = 0;
        setPhase("fall");
        timers.current.push(window.setTimeout(() => setPhase("idle"), FALL_MS));
      }, wait)
    );
  }, []);

  const start = useCallback(() => {
    if (pending.current) return;
    pending.current = true;
    clear();
    setLine((l) => randomItem(LOADING_LINES, l));
    shownAt.current = Date.now();
    setPhase("enter");
    timers.current.push(window.setTimeout(finish, GIVE_UP_MS));
  }, [finish]);

  // "enter" renders the bands below the screen; flush that style, then rise.
  useLayoutEffect(() => {
    if (phase !== "enter") return;
    root.current?.getBoundingClientRect();
    setPhase("up");
  }, [phase]);

  // Same-site link clicks that go to a different page.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
      if (url.pathname === location.pathname) return;
      start();
    };
    const onEvent = () => start();
    document.addEventListener("click", onClick, true);
    window.addEventListener(EVENT, onEvent);
    window.addEventListener("popstate", onEvent);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(EVENT, onEvent);
      window.removeEventListener("popstate", onEvent);
    };
  }, [start]);

  // The new page has rendered.
  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    finish();
  }, [pathname, finish]);

  useEffect(() => () => clear(), []);

  if (phase === "idle") return null;

  return (
    <div ref={root} className="cloud-curtain" data-phase={phase} role="status" aria-label="Loading">
      {CLOUD_BANDS.map((b, i) => (
        <div
          key={i}
          className="cloud-band"
          style={
            {
              "--rest": b.stop === 0 ? `-${CLOUD_EDGE}px` : `${b.stop * 100}svh`,
              "--rise-delay": `${(LAST - i) * RISE_STAGGER}s`,
              "--fall-delay": `${i * FALL_STAGGER}s`,
            } as React.CSSProperties
          }
        >
          <CloudLayerFill color={b.color} bump={b.bump} seed={b.seed} />
        </div>
      ))}
      <div
        className="cloud-copy absolute inset-x-0 grid place-items-center px-gutter text-on-accent"
        style={{ top: `${CLOUD_COPY_TOP * 100}%`, bottom: `${(1 - CLOUD_COPY_BOTTOM) * 100}%` }}
      >
        <div className="flex items-center gap-4">
          <div className="rounded-[12px] bg-on-accent p-1.5 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.35)]">
            <Seal size={34} />
          </div>
          <p className="font-serif text-[clamp(1.7rem,4.6vw,2.4rem)] italic leading-none">{line}</p>
        </div>
      </div>
    </div>
  );
}
