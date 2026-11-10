"use client";

import { useEffect, useRef } from "react";

/**
 * False during the first render (server HTML + hydration), true afterwards.
 * Lets enter animations run on later changes without hiding first-paint content.
 */
export function useMounted() {
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
  return mounted;
}
