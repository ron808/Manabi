import { SettingsForm } from "@/components/app/SettingsForm";
import { requireUser } from "@/lib/server/session";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser("/settings");
  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <p className="eyebrow">Settings</p>
        <h1 className="mt-1 font-serif text-[clamp(2.4rem,7vw,3.6rem)] font-normal leading-[1] tracking-[-0.02em]">
          Make it <em className="text-accent-ink">yours</em>.
        </h1>
      </header>
      <SettingsForm name={user.name} email={user.email} settings={user.settings} />
    </div>
  );
}
