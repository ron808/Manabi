import { Navbar } from "@/components/shared/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-safe sm:px-5 sm:py-10">
        {children}
      </main>
    </div>
  );
}
