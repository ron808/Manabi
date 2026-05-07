import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP, Bricolage_Grotesque } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth/authOptions";
import { DEFAULT_THEME, THEME_STORAGE_KEY, THEMES } from "@/lib/themes";
import "./globals.css";

// Runs before React hydrates so the saved palette is applied before first
// paint — no flash of the default theme. Kept tiny + inlined on purpose.
const themeInitScript = `(function(){try{var ids=${JSON.stringify(
  THEMES.map((t) => t.id)
)};var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});if(t&&ids.indexOf(t)!==-1){document.documentElement.setAttribute('data-theme',t);}else{document.documentElement.setAttribute('data-theme',${JSON.stringify(
  DEFAULT_THEME
)});}}catch(e){}})();`;

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});
const notoJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jp",
  display: "swap",
});
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0B0F1A",
  // viewport-fit=cover lets us read env(safe-area-inset-*) for iPhone notch / home indicator
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  // Allow zoom (don't trap pinch-zoom — accessibility) but don't auto-zoom on input focus
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Manabi — Master Japanese with AI-generated JLPT papers",
  description:
    "Manabi (学び) is a beautifully crafted JLPT study companion. Generate adaptive Japanese exam papers, track your mistakes, and level up — N5 to N1.",
  metadataBase: new URL("https://manabi.app"),
  openGraph: {
    title: "Manabi — Master Japanese, paper by paper",
    description:
      "AI-generated JLPT papers, adaptive difficulty, and a beautiful exam interface.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  return (
    <html lang="en" className="dark" data-theme={DEFAULT_THEME}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${inter.variable} ${notoJp.variable} ${bricolage.variable} aurora min-h-screen antialiased`}
      >
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
