import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import { checkLimit } from "@/lib/ratelimit/upstash";
import { authConfig } from "./config";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

class RateLimited extends CredentialsSignin {
  code = "rate_limited";
}

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "local";
}

// Compared against when the email isn't registered, so response time doesn't
// reveal which emails have accounts.
const DUMMY_HASH = "$2b$12$Orc7gGrs5xMl00e9Clyme.68bXb4DS2eOJ9a3e3ZmxU7i7z4FeQrm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw, request) {
        const limit = await checkLimit("login", clientIp(request));
        if (!limit.success) throw new RateLimited();

        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        await connectDB();
        const user = await User.findOne({ email }).select("name email passwordHash tokenVersion").lean();
        const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !ok) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          tokenVersion: user.tokenVersion ?? 0,
        };
      },
    }),
  ],
});
