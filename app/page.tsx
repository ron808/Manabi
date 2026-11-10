import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ExamSheet } from "@/components/marketing/ExamSheet";
import { ForgettingCurve } from "@/components/marketing/ForgettingCurve";
import { Reveal } from "@/components/marketing/Reveal";
import { Steps } from "@/components/marketing/Steps";
import { TryIt } from "@/components/marketing/TryIt";
import { Logo } from "@/components/ui/Logo";
import { Seal } from "@/components/ui/Seal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const DIFFERENT = [
  {
    jp: "弱点",
    title: "It knows what you don't",
    body: "Every question is tagged with the exact grammar point, word or kanji it tests. Manabi tracks each one, so the next paper aims at your weak spots instead of what you already know.",
  },
  {
    jp: "質問",
    title: "Ask why, about that question",
    body: "Confused by an answer? Ask the tutor. It sees the question, the options and what you picked, and explains in plain English with examples.",
  },
  {
    jp: "本番",
    title: "The real test, when you want it",
    body: "Exam mode uses the official question types for your level, a timer, and no marking until you hand in. Practice mode marks as you go.",
  },
];

export default function LandingPage() {
  return (
    <div className="overflow-x-clip">
      <Reveal />
      <header className="mx-auto flex h-16 max-w-page items-center justify-between px-gutter pt-safe">
        <Logo href="/" />
        <nav className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link href="/login" className="btn btn-ghost btn-sm">
            Sign in
          </Link>
          <Link href="/register" className="btn btn-ink btn-sm hidden sm:inline-flex">
            Start free
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-page items-center gap-12 px-gutter pb-20 pt-10 sm:pt-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16 lg:pb-28 lg:pt-20">
          <div>
            <h1 className="text-[clamp(3rem,9vw,6.2rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
              Master Japanese,
              <span className="block font-serif font-normal italic tracking-[-0.02em] text-accent-ink">paper by paper.</span>
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-ink/70 sm:text-xl">
              Manabi <span className="jp-sans text-ink/50">学び</span> writes JLPT-style papers at your level, marks them
              like a teacher, and brings back every mistake until it sticks. N5 to N1.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="btn btn-primary text-base">
                Write my first paper <ArrowRight size={17} aria-hidden />
              </Link>
              <Link href="/login" className="btn btn-quiet text-base">
                I have an account
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink/50">Free. No card. Works on your phone.</p>
          </div>
          <div className="relative">
            <div aria-hidden className="grid-paper absolute -inset-6 -z-10 rounded-[28px] bg-sunken/60 sm:-inset-10" />
            <ExamSheet className="lg:rotate-[1.5deg]" />
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-ink/10 bg-surface/60 py-20 lg:py-28" aria-labelledby="how">
          <div className="mx-auto max-w-page px-gutter">
            <div data-reveal className="max-w-2xl">
              <p className="eyebrow">How it works</p>
              <h2 id="how" className="mt-2 text-[clamp(2.2rem,5vw,3.6rem)]">
                One paper, four moves.
              </h2>
            </div>
            <div className="mt-12 lg:mt-4">
              <Steps />
            </div>
          </div>
        </section>

        {/* Try it */}
        <section className="mx-auto max-w-page px-gutter py-20 lg:py-28" aria-labelledby="try">
          <div data-reveal className="mb-10 max-w-2xl">
            <p className="eyebrow">Try it — no account needed</p>
            <h2 id="try" className="mt-2 text-[clamp(2.2rem,5vw,3.6rem)]">
              Readings when you want them. <span className="font-serif font-normal italic text-accent-ink">Audio when you need it.</span>
            </h2>
          </div>
          <div data-reveal>
            <TryIt />
          </div>
        </section>

        {/* Mistakes come back */}
        <section className="bg-ink py-20 text-ground lg:py-28" aria-labelledby="sr">
          <div className="mx-auto grid max-w-page items-center gap-12 px-gutter lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
            <div data-reveal>
              <p className="text-sm font-medium text-ground/60">Spaced repetition</p>
              <h2 id="sr" className="mt-2 text-[clamp(2.2rem,5vw,3.6rem)]">
                Get it wrong once. <span className="font-serif font-normal italic">Never twice.</span>
              </h2>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-ground/70">
                Each mistake comes back just as you&apos;re about to forget it. Get it right and the next visit is further
                away; miss it and it returns sooner. Ten minutes a day keeps the whole deck alive.
              </p>
            </div>
            <div data-reveal className="text-ink [--reveal-delay:0.1s]">
              <ForgettingCurve />
            </div>
          </div>
        </section>

        {/* What makes it different */}
        <section className="mx-auto max-w-page px-gutter py-20 lg:py-28" aria-labelledby="diff">
          <h2 id="diff" data-reveal className="max-w-2xl text-[clamp(2.2rem,5vw,3.6rem)]">
            Not a quiz bot.
          </h2>
          <ul className="mt-12 divide-y divide-ink/10 border-y border-ink/10">
            {DIFFERENT.map((d) => (
              <li key={d.jp} data-reveal className="grid gap-3 py-8 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-10 lg:grid-cols-[14rem_minmax(0,22rem)_minmax(0,1fr)]">
                <p className="jp text-[2.6rem] leading-none text-accent-ink lg:text-[3.4rem]" lang="ja">
                  {d.jp}
                </p>
                <h3 className="text-2xl lg:pt-2">{d.title}</h3>
                <p className="max-w-xl leading-relaxed text-ink/70 sm:col-start-2 lg:col-start-3 lg:pt-2">{d.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Close */}
        <section className="mx-auto max-w-page px-gutter pb-24" aria-labelledby="start">
          <div data-reveal className="sheet grid-paper flex flex-col items-start gap-8 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6">
              <Seal size={76} char="始" className="animate-stamp-in" />
              <div>
                <h2 id="start" className="text-[clamp(1.9rem,4vw,2.8rem)]">
                  Your first paper is two minutes away.
                </h2>
                <p className="mt-2 text-ink/65">Pick a level, sit ten questions, see what to work on.</p>
              </div>
            </div>
            <Link href="/register" className="btn btn-primary shrink-0 text-base">
              Create a free account <ArrowRight size={17} aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-page flex-col gap-3 px-gutter py-8 text-sm text-ink/55 sm:flex-row sm:items-center sm:justify-between">
          <Logo href={null} size={22} />
          <p>Master Japanese, paper by paper.</p>
        </div>
      </footer>
    </div>
  );
}
