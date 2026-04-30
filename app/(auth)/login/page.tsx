"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { ReasonBanner } from "@/components/shared/Banner";
import { PasswordField } from "@/components/shared/PasswordField";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    setSubmitting(false);
    if (!res || res.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md"
    >
      <ReasonBanner />
      <div className="card rounded-2xl p-6 sm:p-7">
        <h1 className="font-display text-4xl leading-[1.05] tracking-tighter2 sm:text-5xl">
          Welcome <span className="text-gradient">back</span>
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Continue your study streak.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/55">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/55">
              Password
            </label>
            <PasswordField
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              required
              minLength={1}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-sakura-500/30 bg-sakura-500/10 px-3 py-2 text-sm text-sakura-100">
              {error}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -1 }}
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </motion.button>
        </form>

        <p className="mt-5 text-center text-sm text-white/55">
          New here?{" "}
          <Link href="/register" className="text-brand-400 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="skeleton h-72 w-full max-w-md" />}>
      <LoginInner />
    </Suspense>
  );
}
