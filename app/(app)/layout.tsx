import Link from "next/link";
import { Settings } from "lucide-react";
import { BottomTabs, DesktopNav } from "@/components/app/NavLinks";
import { TimezoneSync } from "@/components/app/TimezoneSync";
import { UserMenu } from "@/components/app/UserMenu";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { requireUser } from "@/lib/server/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-ground/90 pt-safe backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-page items-center justify-between gap-4 px-gutter md:h-16">
          <Logo href="/today" />
          <DesktopNav />
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link href="/settings" aria-label="Settings" className="btn btn-ghost btn-sm !min-h-[40px] !px-2.5 md:hidden">
              <Settings size={18} strokeWidth={1.8} aria-hidden />
            </Link>
            <div className="hidden md:block">
              <UserMenu name={user.name} />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-page px-gutter pb-28 pt-6 md:pb-16 md:pt-10">{children}</main>
      <BottomTabs />
      <TimezoneSync current={user.settings.timezone} />
    </div>
  );
}
