import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ExamSheet } from "@/components/marketing/ExamSheet";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-gutter pb-10 pt-safe">
        <header className="flex h-16 items-center justify-between">
          <Logo href="/" />
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
      <aside aria-hidden className="grid-paper relative hidden items-center justify-center overflow-hidden border-l border-ink/10 bg-sunken/50 p-12 lg:flex">
        <div className="w-full max-w-md rotate-[-2deg]">
          <ExamSheet />
        </div>
      </aside>
    </div>
  );
}
