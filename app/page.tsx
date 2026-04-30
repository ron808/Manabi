"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/shared/Logo";
import {
  MotionPage,
  MotionItem,
  MotionList,
  cardHover,
} from "@/components/shared/Motion";

const features = [
  {
    kanji: "問",
    title: "AI-generated papers",
    body: "Tailored JLPT papers from N5 to N1, drafted by an LLM that writes like a teacher — not a quiz bot.",
  },
  {
    kanji: "誤",
    title: "Mistake intelligence",
    body: "Every wrong answer is logged and explained — in Japanese and English — so the next paper hits the right gap.",
  },
  {
    kanji: "速",
    title: "Built for the train",
    body: "Mobile-first exam UI, large readable Noto Sans JP, and one tap to jump anywhere in the paper.",
  },
];

const steps = [
  { n: "01", title: "Configure", body: "Pick your level, difficulty, formats, and time." },
  { n: "02", title: "Generate", body: "We craft a fresh paper in 3–5 seconds." },
  { n: "03", title: "Sit the exam", body: "One question at a time. Clean. Focused." },
  { n: "04", title: "Review", body: "See exactly what you missed and why." },
];

export default function LandingPage() {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-5">
        <Logo size="md" href="/" />
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/login" className="btn btn-ghost">
            Log in
          </Link>
          <Link href="/register" className="btn btn-primary hidden sm:inline-flex">
            Get started
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-5">
        {/* Hero */}
        <MotionPage>
          <section className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.2fr,1fr] lg:items-center lg:gap-12 lg:py-20">
            <MotionItem>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/65">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
                Now powered by Llama-3.3 70B on Groq
              </p>
              <h1 className="font-display text-5xl leading-[1.02] tracking-tighter2 text-balance sm:text-6xl md:text-7xl">
                Master Japanese,
                <br />
                <span className="text-gradient">paper by paper.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                Manabi (
                <span className="jp text-brand-400" lang="ja">
                  学び
                </span>
                ) generates beautifully crafted JLPT papers on demand. Pick a level,
                choose what you want to drill, and sit a focused exam — built for the
                way you actually study.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/register" className="btn btn-primary text-base">
                  Start studying free →
                </Link>
                <Link href="/login" className="btn btn-ghost text-base">
                  I already have an account
                </Link>
              </div>
              <p className="mt-4 text-xs text-white/40">
                No credit card. 5 free papers per hour. Your data stays yours.
              </p>
            </MotionItem>

            {/* Hero card */}
            <MotionItem className="relative">
              <motion.div
                aria-hidden
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-brand-500/20 via-sakura-500/10 to-transparent blur-2xl"
              />
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="card rounded-3xl p-5 shadow-soft sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-400">
                    Particle fill-in-the-blank
                  </span>
                  <span className="font-mono text-xs text-white/45">14:32</span>
                </div>
                <div className="mt-5">
                  <div className="text-xs text-white/45">Question 7 of 15</div>
                  <p
                    className="jp mt-2 text-xl leading-relaxed text-white sm:text-2xl"
                    lang="ja"
                  >
                    彼女___学校へ行きました。
                  </p>
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {[
                    { l: "A", t: "は", correct: false },
                    { l: "B", t: "が", correct: false },
                    { l: "C", t: "を", correct: false },
                    { l: "D", t: "に", correct: true },
                  ].map((o, i) => (
                    <motion.div
                      key={o.l}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.5 + i * 0.07,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${
                        o.correct
                          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                          : "border-white/10 bg-white/[0.03] text-white/80"
                      }`}
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white/5 font-display text-xs">
                        {o.l}
                      </span>
                      <span className="jp text-base" lang="ja">
                        {o.t}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4 text-xs text-white/45">
                  <span>5 / 15 answered</span>
                  <span className="text-emerald-300">+1 streak</span>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: -8, rotate: 0 }}
                animate={{ opacity: 1, y: 0, rotate: 3 }}
                transition={{ delay: 1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="card animate-float-slow absolute -right-2 -top-4 hidden rounded-xl px-3 py-2 text-xs sm:block"
              >
                <span className="text-emerald-300">+1</span>
                <span className="ml-1 text-white/65">correct</span>
              </motion.div>
            </MotionItem>
          </section>
        </MotionPage>

        {/* Features */}
        <MotionList className="grid gap-4 pb-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <MotionItem key={f.title}>
              <motion.article
                {...cardHover}
                className="card card-hover h-full rounded-2xl p-6"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500/30 to-sakura-500/30">
                  <span className="jp text-xl font-semibold text-white">
                    {f.kanji}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-2xl tracking-tightish text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  {f.body}
                </p>
              </motion.article>
            </MotionItem>
          ))}
        </MotionList>

        {/* How it works */}
        <MotionPage className="py-12">
          <MotionItem className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-brand-400">
                Workflow
              </p>
              <h2 className="mt-1 font-display text-3xl tracking-tighter2 sm:text-4xl md:text-5xl">
                From config to <span className="text-gradient">clarity</span> in 60s.
              </h2>
            </div>
          </MotionItem>
          <MotionList className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" delay={0.1}>
            {steps.map((s) => (
              <MotionItem key={s.n}>
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="card h-full rounded-2xl p-5"
                >
                  <span className="font-mono text-xs text-white/40">{s.n}</span>
                  <h3 className="mt-1 font-display text-xl tracking-tightish">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-sm text-white/60">{s.body}</p>
                </motion.div>
              </MotionItem>
            ))}
          </MotionList>
        </MotionPage>

        {/* CTA */}
        <MotionItem
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <section className="my-16 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-500/15 via-ink-800 to-sakura-500/10 p-8 text-center sm:p-14">
            <h2 className="font-display text-3xl leading-[1.05] tracking-tighter2 sm:text-4xl md:text-5xl">
              Your next JLPT prep session
              <br className="hidden sm:block" />{" "}
              is one <span className="text-gradient">click</span> away.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/65 sm:text-base">
              Start with a free account. Generate your first paper in seconds.
            </p>
            <Link href="/register" className="btn btn-primary mt-6 text-base">
              Create your free account
            </Link>
          </section>
        </MotionItem>
      </main>

      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-white/45 sm:flex-row sm:px-5">
          <div className="flex items-center gap-2">
            <Logo size="sm" href={null} />
            <span>· Master Japanese, paper by paper.</span>
          </div>
          <div>© {new Date().getFullYear()} Manabi</div>
        </div>
      </footer>
    </div>
  );
}
