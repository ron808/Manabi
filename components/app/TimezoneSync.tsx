"use client";

import { useEffect } from "react";
import { saveSetting } from "@/lib/client/api";

/** Streaks and "today" use the learner's timezone; capture it once if we don't have it. */
export function TimezoneSync({ current }: { current: string | null }) {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && tz !== current) saveSetting({ timezone: tz });
    } catch {
      // ignore
    }
  }, [current]);
  return null;
}
