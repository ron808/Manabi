"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// The red pen. Correct and wrong are told apart by shape (◯ / ✕), never by
// colour alone — and every mark is the same vermilion, like a real teacher's.

const MARU =
  "M24 9.5C46 2.8 99 3.6 113 16.4c10 9.3-6.4 26.8-46.8 28.6C30 46.6 5.6 40.3 6.6 26.1 7.4 17.9 18.2 10.6 34 7.8";
const BATSU_A = "M18 16C34 32 54 58 82 84";
const BATSU_B = "M84 17C66 36 41 60 17 85";

const EASE = [0.22, 1, 0.36, 1] as const;

function strokeProps(animate: boolean, reduce: boolean | null, delay: number, duration: number) {
  if (!animate || reduce) return { initial: false as const };
  return {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: {
      pathLength: { duration, delay, ease: EASE },
      opacity: { duration: 0.01, delay },
    },
  };
}

/**
 * Scales the hand-drawn loop's coordinates (not the rendering) to the box,
 * so the stroke stays even and the draw-on animation measures the real path.
 * Every number in MARU is part of an x,y pair, so parity tells them apart.
 */
function maruFor(w: number, h: number) {
  const sx = w / 120;
  const sy = h / 50;
  let i = 0;
  return MARU.replace(/-?\d*\.?\d+/g, (n) => (Number(n) * (i++ % 2 === 0 ? sx : sy)).toFixed(1));
}

/** ◯ drawn around the whole row it sits in. Parent must be `relative`. */
export function Maru({ animate = true, delay = 0 }: { animate?: boolean; delay?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox((b) => (b && Math.abs(b.w - r.width) < 1 && Math.abs(b.h - r.height) < 1 ? b : { w: r.width, h: r.height }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      aria-hidden
      viewBox={box ? `0 0 ${box.w} ${box.h}` : undefined}
      className="pointer-events-none absolute -inset-x-3 -inset-y-2 h-[calc(100%+1rem)] w-[calc(100%+1.5rem)] overflow-visible"
    >
      {box && (
        <motion.path
          d={maruFor(box.w, box.h)}
          fill="none"
          stroke="rgb(var(--accent))"
          strokeWidth={2.6}
          strokeLinecap="round"
          {...strokeProps(animate, reduce, delay, 0.7)}
        />
      )}
    </svg>
  );
}

/** ✕ struck over the choice marker at the start of a row. Parent must be `relative`. */
export function Batsu({ animate = true, delay = 0 }: { animate?: boolean; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      className="pointer-events-none absolute left-1 top-1/2 h-12 w-12 -translate-y-1/2 overflow-visible"
    >
      <motion.path
        d={BATSU_A}
        fill="none"
        stroke="rgb(var(--accent))"
        strokeWidth={7}
        strokeLinecap="round"
        {...strokeProps(animate, reduce, delay, 0.28)}
      />
      <motion.path
        d={BATSU_B}
        fill="none"
        stroke="rgb(var(--accent))"
        strokeWidth={7}
        strokeLinecap="round"
        {...strokeProps(animate, reduce, delay + 0.22, 0.28)}
      />
    </svg>
  );
}

// 花丸: a spiral inside a ring of petals — what a Japanese teacher draws on
// excellent work.
function hanamaruPaths() {
  const cx = 50;
  const cy = 50;
  const spiral: string[] = [];
  const turns = 2.6;
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const a = -Math.PI / 2 + t * turns * Math.PI * 2;
    const r = 3 + t * 25;
    spiral.push(`${i === 0 ? "M" : "L"}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  const petals = 9;
  const ring: string[] = [];
  for (let i = 0; i <= petals; i++) {
    const a = -Math.PI / 2 + (i / petals) * Math.PI * 2;
    const x = cx + 32 * Math.cos(a);
    const y = cy + 32 * Math.sin(a);
    if (i === 0) {
      ring.push(`M${x.toFixed(1)} ${y.toFixed(1)}`);
      continue;
    }
    const mid = a - Math.PI / petals;
    const qx = cx + 52 * Math.cos(mid);
    const qy = cy + 52 * Math.sin(mid);
    ring.push(`Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return { spiral: spiral.join(""), ring: ring.join("") };
}

const HANAMARU = hanamaruPaths();

export function Hanamaru({
  size = 120,
  animate = true,
  delay = 0,
  className = "",
}: {
  size?: number;
  animate?: boolean;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <svg
      width={size}
      height={size}
      viewBox="-4 -4 108 108"
      role="img"
      aria-label="Hanamaru — excellent"
      className={`overflow-visible ${className}`}
    >
      <motion.path
        d={HANAMARU.spiral}
        fill="none"
        stroke="rgb(var(--accent))"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...strokeProps(animate, reduce, delay, 0.9)}
      />
      <motion.path
        d={HANAMARU.ring}
        fill="none"
        stroke="rgb(var(--accent))"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...strokeProps(animate, reduce, delay + 0.75, 1.1)}
      />
    </svg>
  );
}
