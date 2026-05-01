import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // Don't throw at import time during build — only when actually used.
  console.warn("[manabi] MONGODB_URI not set");
}

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache =
  global._mongooseCache || (global._mongooseCache = { conn: null, promise: null });

export async function connectDB(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!cached.promise) {
    // Tuned for Vercel serverless + MongoDB Atlas:
    //  - small pool (each lambda is single-flight)
    //  - aggressive server selection timeout so cold-starts fail fast instead
    //    of hanging the whole function
    //  - keep-alive sockets for warm container reuse
    //  - zlib compression cuts wire size for question docs (~30–80 KB) by 5–10x
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        family: 4, // IPv4 — avoids slow IPv6 fallback on some hosts
        compressors: ["zlib"],
        zlibCompressionLevel: 6,
      })
      .catch((err) => {
        // Reset on failure so the next request can retry instead of being
        // stuck on a rejected promise forever.
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
