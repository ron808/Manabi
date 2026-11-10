"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="sheet mx-auto max-w-lg p-8 text-center">
      <p className="jp text-4xl text-accent-ink" aria-hidden>
        ✕
      </p>
      <h1 className="mt-3 text-2xl">That page didn&apos;t load</h1>
      <p className="mt-2 text-ink/65">Something went wrong on our side. Your answers so far are saved.</p>
      <div className="mt-6 flex justify-center gap-2">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/today" className="btn btn-quiet">
          Go to Today
        </Link>
      </div>
    </div>
  );
}
