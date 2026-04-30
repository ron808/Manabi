"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function ReasonBanner() {
  const params = useSearchParams();
  const reason = params.get("reason");
  const [open, setOpen] = useState(true);
  useEffect(() => setOpen(true), [reason]);
  if (!reason || !open) return null;

  const messages: Record<string, string> = {
    session_expired: "Your session expired. Please log in again.",
    registered: "Account created. Please log in.",
  };
  const msg = messages[reason] ?? null;
  if (!msg) return null;

  return (
    <div className="mx-auto mb-4 flex max-w-md items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
      <span>{msg}</span>
      <button
        onClick={() => setOpen(false)}
        className="text-white/50 hover:text-white"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
