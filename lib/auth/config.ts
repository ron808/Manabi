import type { NextAuthConfig } from "next-auth";

// Edge-safe half of the auth setup: no database, no bcrypt. Middleware uses
// this to verify the session JWT; lib/auth/index.ts adds the credentials
// provider for the Node runtime.

export const PROTECTED_PREFIXES = ["/today", "/new", "/test", "/results", "/review", "/history", "/settings"];

export function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export const authConfig = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.tv = (user as { tokenVersion?: number }).tokenVersion ?? 0;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        (session.user as { tokenVersion?: number }).tokenVersion = (token.tv as number) ?? 0;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
