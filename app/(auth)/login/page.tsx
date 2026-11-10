"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { PasswordField } from "@/components/ui/PasswordField";
import { beginNavigation } from "@/components/ui/NavCurtain";

const REASONS: Record<string, string> = {
  expired: "Your session ended. Sign in again to carry on — your progress is saved.",
  password: "Password changed. Sign in with the new one.",
  registered: "Account created. Sign in to start.",
};

/** Only allow same-site paths as a post-login destination. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/today";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const reason = REASONS[params.get("reason") ?? ""];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn("credentials", { email: email.trim().toLowerCase(), password, redirect: false }).catch(() => null);
    if (!res || res.error) {
      setBusy(false);
      setError(
        res?.code === "rate_limited"
          ? "Too many attempts from this network. Wait a few minutes and try again."
          : res
            ? "That email and password don't match."
            : "Couldn't reach Manabi. Check your connection."
      );
      return;
    }
    beginNavigation();
    router.replace(next);
    router.refresh();
  }

  return (
    <>
      <h1 className="font-serif text-[2.8rem] font-normal leading-[1]">
        Welcome <em className="text-accent-ink">back</em>
      </h1>
      <p className="mt-2 text-ink/65">Your review deck is waiting.</p>
      {reason && <p className="mt-6 rounded-md bg-ink/[0.05] px-4 py-3 text-sm">{reason}</p>}
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <PasswordField id="password" value={password} onChange={setPassword} autoComplete="current-password" required />
        </div>
        {error && (
          <p role="alert" className="rounded-md bg-accent/10 px-4 py-3 text-sm text-accent-ink">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink/65">
        New to Manabi?{" "}
        <Link href="/register" className="link">
          Create an account
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96" />}>
      <LoginForm />
    </Suspense>
  );
}
