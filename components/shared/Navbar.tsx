"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Logo } from "./Logo";

const links = [
  { href: "/dashboard", label: "Dashboard", short: "Home" },
  { href: "/configure", label: "New Paper", short: "New" },
  { href: "/history", label: "History", short: "History" },
  { href: "/mistakes", label: "Mistakes", short: "Mistakes" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-900/80 pt-safe backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-5">
        <Logo size="md" href="/dashboard" />
        <nav className="hidden gap-1 md:flex">
          {links.map((l) => {
            const active =
              pathname === l.href || pathname?.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {session?.user?.name && (
            <span className="hidden max-w-[160px] truncate text-sm text-white/60 sm:inline">
              {session.user.name}
            </span>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            aria-label="Sign out"
            className="btn btn-ghost !min-h-[40px] !px-3 !py-1.5 text-xs"
          >
            <span className="hidden sm:inline">Sign out</span>
            <span className="sm:hidden" aria-hidden>
              ↩
            </span>
          </button>
        </div>
      </div>
      {/* Mobile nav */}
      <nav
        aria-label="Primary"
        className="-mb-px flex gap-1 overflow-x-auto border-t border-white/5 px-2 py-1.5 md:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {links.map((l) => {
          const active =
            pathname === l.href || pathname?.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[40px] shrink-0 items-center whitespace-nowrap rounded-lg px-3 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/65 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
