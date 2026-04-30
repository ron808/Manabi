"use client";

import { useEffect, useRef, useState } from "react";

export function formatMMSS(secs: number): string {
  const s = Math.max(0, Math.floor(secs));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function Timer({
  totalSeconds,
  onExpire,
  paused = false,
}: {
  totalSeconds: number;
  onExpire: () => void;
  paused?: boolean;
}) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [paused, onExpire]);

  const danger = remaining <= 120;
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-sm tracking-wider transition-colors ${
        danger
          ? "border-sakura-500/40 bg-sakura-500/10 text-sakura-200"
          : "border-white/10 bg-white/5 text-white/80"
      }`}
      aria-live="polite"
    >
      <span
        className={`h-2 w-2 rounded-full ${
          danger ? "animate-pulse bg-sakura-400" : "bg-emerald-400"
        }`}
      />
      {formatMMSS(remaining)}
    </div>
  );
}
