import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo size="md" href="/" />
        <Link href="/" className="text-sm text-white/55 hover:text-white">
          ← Back
        </Link>
      </header>
      <main className="relative z-10 mx-auto flex max-w-6xl items-center justify-center px-5 pb-16 pt-4">
        {children}
      </main>
    </div>
  );
}
