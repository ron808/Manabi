# Manabi 学び

> Master Japanese, paper by paper.

A full-stack JLPT study app built on Next.js 14, NextAuth v5, MongoDB Atlas,
Groq (Llama-3.3-70B), Upstash Redis rate limiting, and Tailwind. Generates
adaptive Japanese question papers, tracks every mistake, and gives a focused,
mobile-first exam interface.

## Stack

- Next.js 14 (App Router, TypeScript strict)
- Tailwind CSS — custom dark theme (ink + brand indigo + sakura accents)
- next-auth v5 (credentials provider, JWT sessions)
- MongoDB Atlas + Mongoose
- Groq SDK (server-only, `llama-3.3-70b-versatile`, `response_format: json_object`)
- @upstash/ratelimit + @upstash/redis
- zod for input validation, bcryptjs for password hashing

## Quick start

```bash
cp .env.example .env.local
# Fill the values, then:
npm install
npm run dev
# → http://localhost:3000
```

You'll need:

| Service | Where |
| ------- | ----- |
| MongoDB Atlas | https://cloud.mongodb.com — copy the connection string into `MONGODB_URI` |
| Groq | https://console.groq.com — `GROQ_API_KEY` (server only, never `NEXT_PUBLIC_*`) |
| Upstash Redis (optional) | https://console.upstash.com — `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. If omitted, rate limiting is disabled. |
| NextAuth secret | `openssl rand -base64 32` for both `NEXTAUTH_SECRET` and `AUTH_SECRET` |

## Architecture

```
/app
  page.tsx              landing
  (auth)/login,register
  (app)/
    dashboard, configure
    test/[paperId]
    results/[paperId]
    history, mistakes
  api/
    auth/[...nextauth], auth/register
    papers/generate, papers, papers/[paperId]
    papers/[paperId]/answer, papers/[paperId]/complete
    mistakes, me

/components
  configure/  LevelSelector, DifficultySlider, FormatSelector, TestSettings
  test/       QuestionNavigator, QuestionCard, AnswerOptions, Timer
  results/    ScoreSummary, AnswerReview
  dashboard/  StatsBar, RecentPapers
  shared/     Logo, Navbar, ErrorBanner, SkeletonCard, Banner

/lib
  db/         mongoose singleton, User & Paper models
  auth/       authOptions (NextAuth v5)
  ai/         groq.ts — system + user prompt builders
  validation/ zod schemas (strict, with custom-instructions rule)
  ratelimit/  Upstash sliding-window helper
  api/        helpers (requireAuth, applyRateLimit, jsonError)
  types.ts    shared TS interfaces

middleware.ts   protects /dashboard /configure /test /results /history /mistakes
```

## Security

- All API routes require a valid session (`requireAuth`).
- Every Paper query is scoped by `userId`. A user cannot read another user's papers.
- All bodies validated with strict zod schemas (unknown fields rejected).
- Passwords hashed with bcryptjs (cost 12). Password hash never returned.
- Rate limits: 5 paper generations per user per hour, 3 registers per IP per hour,
  10 logins per IP per 15 min, 60 general API calls per user per minute.
- CSP and security headers in `next.config.mjs`.
- Groq key is server-only and never sent to the browser.

## Deploying to Vercel

1. Push to GitHub, import on Vercel.
2. Add every env var from `.env.example` to the Vercel dashboard.
3. Set `NEXTAUTH_URL` and `AUTH_URL` to your Vercel deployment URL.
4. MongoDB Atlas: whitelist `0.0.0.0/0` (Vercel serverless IPs are dynamic).
5. Smoke test: register → generate paper → take it → results.
6. Hit `/api/papers/generate` 6× to verify the rate limit.

## Out of scope (V1)

OAuth, audio for listening questions, spaced repetition, PDF export,
admin dashboard, email verification, password reset.
