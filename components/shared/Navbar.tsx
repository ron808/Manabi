"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Logo } from "./Logo";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/configure", label: "New Paper" },
  { href: "/history", label: "History" },
  { href: "/mistakes", label: "Mistakes" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-900/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
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
        <div className="flex items-center gap-3">
          {session?.user?.name && (
            <span className="hidden text-sm text-white/60 sm:inline">
              {session.user.name}
            </span>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="btn btn-ghost text-xs"
          >
            Sign out
          </button>
        </div>
      </div>
      {/* Mobile nav */}
      <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-3 py-2 md:hidden">
        {links.map((l) => {
          const active =
            pathname === l.href || pathname?.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white"
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
