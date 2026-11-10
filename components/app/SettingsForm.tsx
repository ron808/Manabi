"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Check, Download, LogOut } from "lucide-react";
import { PasswordField } from "@/components/ui/PasswordField";
import { api, ApiClientError } from "@/lib/client/api";
import { LEVELS, type Level } from "@/lib/domain/jlpt";
import { THEME_CHOICES, applyTheme, readTheme, type ThemeChoice } from "@/lib/ui/theme";

interface Settings {
  targetLevel: string | null;
  examDate: string | null;
  dailyGoal: number;
  furigana: boolean;
  timezone: string | null;
}

/** The JLPT runs on the first Sunday of July and of December. */
function nextExamDates(from = new Date()): string[] {
  const out: string[] = [];
  for (let y = from.getFullYear(); out.length < 2; y++) {
    for (const m of [6, 11]) {
      const d = new Date(Date.UTC(y, m, 1));
      d.setUTCDate(1 + ((7 - d.getUTCDay()) % 7));
      if (d.getTime() > from.getTime() && out.length < 2) out.push(d.toISOString().slice(0, 10));
    }
  }
  return out;
}

function useSaver() {
  const [state, setState] = useState<"idle" | "saving" | "saved" | { error: string }>("idle");
  async function run(fn: () => Promise<unknown>) {
    setState("saving");
    try {
      await fn();
      setState("saved");
      window.setTimeout(() => setState("idle"), 1800);
    } catch (err) {
      setState({ error: err instanceof ApiClientError ? err.message : "Couldn't save. Try again." });
    }
  }
  return { state, run };
}

function SaveStatus({ state }: { state: ReturnType<typeof useSaver>["state"] }) {
  if (state === "saving") return <span className="text-sm text-ink/55">Saving…</span>;
  if (state === "saved")
    return (
      <span className="inline-flex items-center gap-1 text-sm text-ink/70">
        <Check size={15} aria-hidden /> Saved
      </span>
    );
  if (typeof state === "object")
    return (
      <span role="alert" className="text-sm text-accent-ink">
        {state.error}
      </span>
    );
  return null;
}

function Section({ title, children, note }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-ink/10 py-8 md:grid-cols-[14rem_1fr] md:gap-10">
      <div>
        <h2 className="text-lg">{title}</h2>
        {note && <p className="mt-1 text-sm text-ink/55">{note}</p>}
      </div>
      <div className="min-w-0 space-y-5">{children}</div>
    </section>
  );
}

export function SettingsForm({ name: initialName, email, settings }: { name: string; email: string; settings: Settings }) {
  const [name, setName] = useState(initialName);
  const [target, setTarget] = useState<string | null>(settings.targetLevel);
  const [examDate, setExamDate] = useState(settings.examDate ?? "");
  const [goal, setGoal] = useState(settings.dailyGoal);
  const [furigana, setFurigana] = useState(settings.furigana);
  const [theme, setTheme] = useState<ThemeChoice>("system");
  const profile = useSaver();
  const study = useSaver();

  useEffect(() => setTheme(readTheme()), []);
  const upcoming = nextExamDates();

  return (
    <div>
      <Section title="You">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void profile.run(() => api("/api/me", { method: "PATCH", body: { name } }));
          }}
          className="space-y-4"
        >
          <div>
            <label className="label" htmlFor="name">
              Name
            </label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required className="field" autoComplete="name" />
          </div>
          <p className="text-sm text-ink/55">Signed in as {email}</p>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn btn-ink btn-sm" disabled={!name.trim() || name === initialName}>
              Save
            </button>
            <SaveStatus state={profile.state} />
          </div>
        </form>
      </Section>

      <Section title="Study" note="Shapes Today's session, the countdown and new papers.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void study.run(() =>
              api("/api/me", {
                method: "PATCH",
                body: { settings: { targetLevel: target as Level | null, examDate: examDate || null, dailyGoal: goal, furigana } },
              })
            );
          }}
          className="space-y-6"
        >
          <fieldset>
            <legend className="label">Level you&apos;re aiming for</legend>
            <div className="flex flex-wrap gap-2">
              <button type="button" data-on={target === null} onClick={() => setTarget(null)} className="chip">
                Not sure yet
              </button>
              {LEVELS.map((l) => (
                <button key={l} type="button" data-on={target === l} onClick={() => setTarget(l)} className="chip tabular">
                  {l}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label className="label" htmlFor="exam">
              Exam date
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input id="exam" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="field !w-auto" />
              {upcoming.map((d) => (
                <button key={d} type="button" data-on={examDate === d} onClick={() => setExamDate(d)} className="chip !text-[0.8rem]">
                  {new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
                </button>
              ))}
              {examDate && (
                <button type="button" onClick={() => setExamDate("")} className="btn btn-ghost btn-sm">
                  Clear
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="goal">
              Daily goal (questions + reviews)
            </label>
            <input
              id="goal"
              type="number"
              inputMode="numeric"
              min={5}
              max={300}
              value={goal}
              onChange={(e) => setGoal(Math.max(5, Math.min(300, Number(e.target.value) || 5)))}
              className="field !w-28 tabular"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={furigana} onChange={(e) => setFurigana(e.target.checked)} className="h-[18px] w-[18px] accent-[rgb(var(--accent))]" />
            <span>
              Show furigana by default <span className="jp-sans text-ink/50">ふりがな</span>
            </span>
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn btn-ink btn-sm">
              Save
            </button>
            <SaveStatus state={study.state} />
          </div>
        </form>
      </Section>

      <Section title="Appearance">
        <div role="radiogroup" aria-label="Theme" className="grid max-w-md grid-cols-3 gap-2">
          {THEME_CHOICES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={theme === t.id}
              onClick={() => {
                applyTheme(t.id);
                setTheme(t.id);
              }}
              className="chip !rounded-md flex-col !gap-0.5 !py-3"
            >
              <span className="font-medium">{t.label}</span>
              <span className="jp-sans text-xs opacity-60">{t.jp}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Password" note="Changing it signs you out everywhere else.">
        <PasswordChange />
      </Section>

      <Section title="Your data">
        <a href="/api/me/export" className="btn btn-quiet btn-sm w-fit" download>
          <Download size={15} aria-hidden /> Download everything (JSON)
        </a>
        <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="btn btn-quiet btn-sm w-fit">
          <LogOut size={15} aria-hidden /> Sign out
        </button>
        <DeleteAccount />
      </Section>
    </div>
  );
}

function PasswordChange() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const saver = useSaver();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void saver.run(async () => {
          await api("/api/me/password", { body: { current, next } });
          // The session we hold was just invalidated; sign in again with the new password.
          await signOut({ callbackUrl: "/login?reason=password" });
        });
      }}
      className="max-w-sm space-y-4"
    >
      <div>
        <label className="label" htmlFor="pw-current">
          Current password
        </label>
        <PasswordField id="pw-current" value={current} onChange={setCurrent} autoComplete="current-password" required />
      </div>
      <div>
        <label className="label" htmlFor="pw-next">
          New password
        </label>
        <PasswordField id="pw-next" value={next} onChange={setNext} autoComplete="new-password" minLength={8} required />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-ink btn-sm" disabled={!current || next.length < 8}>
          Change password
        </button>
        <SaveStatus state={saver.state} />
      </div>
    </form>
  );
}

function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const saver = useSaver();
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost btn-sm w-fit !text-accent-ink">
        Delete my account
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void saver.run(async () => {
          await api("/api/me", { method: "DELETE", body: { password } });
          await signOut({ callbackUrl: "/" });
        });
      }}
      className="max-w-sm space-y-3 rounded-md bg-accent/[0.07] p-4"
    >
      <p className="text-sm">
        This permanently deletes your account, every paper, and your review deck. It can&apos;t be undone.
      </p>
      <div>
        <label className="label" htmlFor="pw-delete">
          Enter your password to confirm
        </label>
        <PasswordField id="pw-delete" value={password} onChange={setPassword} autoComplete="current-password" required />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={!password}>
          Delete permanently
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">
          Cancel
        </button>
        <SaveStatus state={saver.state} />
      </div>
    </form>
  );
}
