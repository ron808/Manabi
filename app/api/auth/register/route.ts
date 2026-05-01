import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import { registerSchema } from "@/lib/validation/schemas";
import { applyRateLimit, getClientIp, jsonError } from "@/lib/api/helpers";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  // Run rate limit, DB connect, AND password hashing (~150ms with 12 rounds)
  // in parallel — they're all independent. Hashing is CPU but the others are
  // I/O so they overlap.
  const [limited] = await Promise.all([
    applyRateLimit("register", ip),
    connectDB(),
  ]);
  if (limited) return limited;

  const [existing, passwordHash] = await Promise.all([
    User.findOne({ email }).select("_id").lean(),
    bcrypt.hash(password, 12),
  ]);
  if (existing) {
    return jsonError("An account with this email already exists", 409);
  }

  const created = await User.create({
    name,
    email,
    passwordHash,
  });

  return NextResponse.json(
    {
      ok: true,
      user: { id: created._id.toString(), name: created.name, email: created.email },
    },
    { status: 201 }
  );
}
