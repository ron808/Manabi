"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, History, PenLine, Sun } from "lucide-react";

export const NAV = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/new", label: "New paper", short: "New", icon: PenLine },
  { href: "/review", label: "Review", icon: BookOpenCheck },
  { href: "/history", label: "History", icon: History },
] as const;

function useActive() {
  const pathname = usePathname() ?? "";
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav() {
  const isActive = useActive();
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
      {NAV.map((l) => {
        const on = isActive(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={on ? "page" : undefined}
            className={`relative rounded-md px-3 py-2 text-sm transition-colors ${
              on ? "text-ink" : "text-ink/60 hover:text-ink"
            }`}
          >
            {l.label}
            {on && <span aria-hidden className="absolute inset-x-3 -bottom-[13px] h-[2px] rounded-full bg-accent" />}
          </Link>
        );
      })}
    </nav>
  );
}

/** Thumb-reach tab bar for phones. Hidden while sitting a paper. */
export function BottomTabs() {
  const isActive = useActive();
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/test/")) return null;
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-ground/92 pb-safe backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {NAV.map((l) => {
          const on = isActive(l.href);
          const Icon = l.icon;
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                  on ? "text-accent-ink" : "text-ink/55"
                }`}
              >
                <Icon size={20} strokeWidth={on ? 2.2 : 1.8} aria-hidden />
                {"short" in l ? l.short : l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
