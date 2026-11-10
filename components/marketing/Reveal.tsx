"use client";

import { useEffect } from "react";

/**
 * Fades up `[data-reveal]` elements that start below the fold. The hidden
 * state is set here, by script, so the page is complete without JS and
 * nothing already on screen blinks after hydration.
 */
export function Reveal() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]")).filter(
      (el) => el.getBoundingClientRect().top > window.innerHeight
    );
    els.forEach((el) => (el.dataset.reveal = "hidden"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.reveal = "shown";
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
