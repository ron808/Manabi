"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { PasswordField } from "@/components/ui/PasswordField";
import { beginNavigation, cancelNavigation } from "@/components/ui/NavCurtain";
import { api, ApiClientError } from "@/lib/client/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    setBusy(true);
    beginNavigation();
    try {
      let timezone: string | null = null;
      try {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        // ignore
      }
      await api("/api/auth/register", { body: { name: name.trim(), email: email.trim(), password, timezone } });
      const res = await signIn("credentials", { email: email.trim().toLowerCase(), password, redirect: false });
      if (!res || res.error) {
        beginNavigation(() => router.push("/login?reason=registered"));
        return;
      }
      beginNavigation(() => {
        router.replace("/today");
        router.refresh();
      });
    } catch (err) {
      cancelNavigation();
      setError(err instanceof ApiClientError ? err.message : "Couldn't create the account. Try again.");
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="font-serif text-[2.8rem] font-normal leading-[1]">
        Start <em className="text-accent-ink">learning</em>
      </h1>
      <p className="mt-2 text-ink/65">Free. Your first paper is two minutes away.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input id="name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className="field" autoComplete="name" placeholder="Aiko" />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" placeholder="you@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <PasswordField id="password" value={password} onChange={setPassword} autoComplete="new-password" minLength={8} required placeholder="At least 8 characters" />
        </div>
        {error && (
          <p role="alert" className="rounded-md bg-accent/10 px-4 py-3 text-sm text-accent-ink">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy ? "Creating your account…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink/65">
        Already have one?{" "}
        <Link href="/login" className="link">
          Sign in
        </Link>
      </p>
    </>
  );
}
