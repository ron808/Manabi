import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { IntroCurtain } from "@/components/ui/IntroCurtain";
import { NavCurtain } from "@/components/ui/NavCurtain";
import { themeInitScript } from "@/lib/ui/theme";
import "./globals.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F1E9" },
    { media: "(prefers-color-scheme: dark)", color: "#151311" },
  ],
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Manabi — Master Japanese, paper by paper",
    template: "%s · Manabi",
  },
  description:
    "Manabi (学び) writes JLPT-style Japanese papers for your level, marks them like a teacher, and brings every mistake back until you know it. N5 to N1.",
  metadataBase: new URL("https://manabi.app"),
  openGraph: {
    title: "Manabi — Master Japanese, paper by paper",
    description:
      "JLPT-style papers written for your level, marked instantly, and every mistake brought back until it sticks.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${serif.variable}`}
      style={{ ["--font-sans" as string]: "var(--font-geist-sans)" }}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
        <IntroCurtain />
        <NavCurtain />
      </body>
    </html>
  );
}
