import Link from "next/link";
import { Seal } from "@/components/ui/Seal";

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center px-gutter">
      <div className="text-center">
        <div className="mx-auto w-fit">
          <Seal size={56} char="無" />
        </div>
        <h1 className="mt-6 font-serif text-5xl font-normal">Not here</h1>
        <p className="mt-3 text-ink/65">That page doesn&apos;t exist, or it isn&apos;t yours to see.</p>
        <Link href="/" className="btn btn-primary mt-6">
          Go home
        </Link>
      </div>
    </main>
  );
}
