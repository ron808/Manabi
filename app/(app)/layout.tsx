import { Navbar } from "@/components/shared/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">{children}</main>
    </div>
  );
}
