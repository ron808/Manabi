# Manabi 学び

> Master Japanese, paper by paper.

Manabi writes JLPT-style Japanese papers at your level, marks them like a
teacher, and brings every mistake back on a spaced-repetition schedule until
it sticks. N5 to N1.

## What it does

- **Papers on demand** — real JLPT question types (漢字読み, 文脈規定,
  文の組み立て ★, 内容理解, 課題理解 …) plus typed-recall drills. Practice
  mode marks as you go; exam mode is timed and marked when you hand in.
- **Questions checked twice** — a second model answers every multiple-choice
  question blind; any it confidently disagrees with is thrown away and
  rewritten.
- **Learning points** — every question is tagged with the grammar point, word
  or kanji it tests. Mastery is tracked per point, and "weak spots" papers aim
  straight at the shaky ones.
- **Review deck** — every mistake (and every lucky guess) becomes an FSRS card
  that returns just before you'd forget it.
- **Today** — one button: due reviews first, then ten fresh questions on your
  weak points. Streak, daily goal, 18-week heatmap, exam countdown.
- **Ask why** — a tutor that knows the exact question, the options and what
  you picked.
- **Japanese aids** — furigana on/off, listening questions spoken by the
  device's Japanese voice, romaji → kana typing (WanaKana).

## Stack

Next.js 14 (App Router, TypeScript strict) · Tailwind · next-auth v5
(credentials, JWT) · MongoDB + Mongoose · Groq (`openai/gpt-oss-120b`, with
`openai/gpt-oss-20b` as fallback writer and blind checker, strict JSON-schema
outputs) · ts-fsrs · WanaKana · Upstash rate limiting · framer-motion · Vitest.

## Quick start

```bash
cp .env.example .env.local   # fill in AUTH_SECRET and MONGODB_URI
npm install
npm run dev                  # http://localhost:3000
```

With `GROQ_API_KEY` empty, local development uses a built-in set of sample
questions (never in production), so the whole app works without a key.

```bash
npm test          # unit tests + a lifecycle test against local MongoDB (skipped if none)
npm run typecheck
npm run lint
```

## Layout

```
app/
  page.tsx                 landing
  (auth)/login, register
  (app)/today, new, test/[id], results/[id], review, review/library, history, settings
  api/
    auth/[...nextauth], auth/register
    me, me/password, me/export
    papers                 GET list · POST generate (streams NDJSON progress)
    papers/[id]            GET · answers · complete
    papers/[id]/questions/[qid]           PATCH flag · audio · explain (streams)
    reviews                GET due queue / library
    reviews/[id]           PATCH archive · answer · grade · audio
components/
  ui/        design primitives — Seal (hanko), Mark (◯ ✕ 花丸), Ruby, KanaInput …
  app/       app screens' client pieces — TestRunner, ReviewSession, NewPaperForm …
  marketing/ landing scenes
lib/
  domain/    pure logic — JLPT catalogue, question shape + redaction, FSRS, dates
  ai/        generation (batching, validation, checker), prompts, tutor, dev fixtures
  server/    services used by pages and API routes — papers, reviews, stats, users
  api/       route wrapper (auth, rate limit, zod, uniform errors)
  ja/        furigana markup, answer normalisation, speech
  db/        Mongoose models
tests/       Vitest
```

## How the backend keeps things honest

- **Answers stay on the server.** A question's answer, explanation and (for
  listening) script reach the browser only once it may see them: after
  answering in practice mode, after hand-in in exam mode.
- **The server keeps time.** `deadlineAt` is set when a paper is opened;
  answers after the deadline are refused and the paper is handed in.
  `timeTakenSeconds` is computed on the server.
- **Completing is atomic.** Score and time are set in one update guarded by
  `status != completed`; stats, activity, mastery and review cards are written
  only by the call that made the transition.
- **History is never rewritten.** Archiving a review card doesn't touch the
  paper it came from.
- **Old papers keep working.** v1 papers (letter-prefixed options) are
  converted on read and upgraded in place when resumed; old mistakes are
  imported into the review deck on first visit.

## Security

- Every API route goes through `lib/api/handler.ts`: session verified against
  the database (and against a token version, so changing your password signs
  out other sessions), per-user rate limit, strict zod body validation.
- Middleware verifies the session JWT at the edge.
- Rate limits: 5 papers/hour, 30 tutor questions/hour, 10 logins/15 min per IP,
  3 sign-ups/hour per IP, 5 sensitive account actions/15 min.
- bcrypt (cost 12) with constant-time behaviour for unknown emails.
- CSP with `connect-src 'self'` (Groq and Upstash are server-side only), no
  `unsafe-eval` in production, HSTS, `frame-ancestors 'none'`.

## Deploying to Vercel

1. Add the variables from `.env.example` in the Vercel dashboard.
2. MongoDB Atlas: allow Vercel's dynamic IPs (`0.0.0.0/0`) or use a private
   endpoint.
3. `vercel.json` gives paper generation and the tutor up to 60 s.
