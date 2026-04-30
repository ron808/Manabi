"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { PasswordField } from "@/components/shared/PasswordField";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Registration failed");
      }
      const signinRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (!signinRes || signinRes.error) {
        router.push("/login?reason=registered");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md"
    >
      <div className="card rounded-2xl p-6 sm:p-7">
        <h1 className="font-display text-4xl leading-[1.05] tracking-tighter2 sm:text-5xl">
          Create your <span className="text-gradient">account</span>
        </h1>
        <p className="mt-2 text-sm text-white/60">
          One minute. Then your first paper.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/55">
              Name
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/55">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
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
              required
              minLength={8}
              maxLength={200}
              autoComplete="new-password"
              placeholder="At least 8 characters"
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
            {submitting ? "Creating account…" : "Create account"}
          </motion.button>
        </form>

        <p className="mt-5 text-center text-sm text-white/55">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
