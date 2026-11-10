"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Settings } from "lucide-react";
import { beginNavigation } from "@/components/ui/NavCurtain";

export function UserMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account"
        className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-semibold text-ground"
      >
        {initial}
      </button>
      {open && (
        <div role="menu" className="panel absolute right-0 top-full z-50 mt-2 w-56 p-1.5 shadow-[0_18px_40px_-20px_rgb(var(--shadow)/0.5)]">
          <p className="truncate px-3 pb-2 pt-1.5 text-sm font-medium">{name}</p>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-ink/80 hover:bg-ink/[0.05]"
          >
            <Settings size={16} aria-hidden /> Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => beginNavigation(() => void signOut({ callbackUrl: "/" }))}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-ink/80 hover:bg-ink/[0.05]"
          >
            <LogOut size={16} aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
