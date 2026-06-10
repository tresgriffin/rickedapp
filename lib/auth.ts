import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
// GoogleProvider removed for beta — callback route was live but untested.
// Re-add post-beta when the Google sign-in flow is built and tested end-to-end.
import bcrypt from "bcryptjs";
import { Redis } from "@upstash/redis";
import { prisma } from "@/lib/db";

// ─── Login rate limiter ───────────────────────────────────────────────────────
// Counts failed login attempts per email address. Successful logins never
// increment the counter so legitimate users logging in/out aren't throttled.
//
// Fail-open: if Redis is unconfigured or unreachable, auth proceeds normally.
//
// Per-email note: this approach means a known email could be deliberately
// locked out by an attacker (5 bad attempts → 15-min block). Acceptable for
// closed beta. Pre-public hardening should switch to per-(IP+email) keying.

const MAX_FAILURES = 5;
const WINDOW_SECONDS = 15 * 60; // 15 minutes

let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch {
  // Fail open — limiter is a hardening layer, not a hard dependency
}

async function getFailureCount(email: string): Promise<number> {
  if (!redis) return 0;
  try {
    return (await redis.get<number>(`login_failures:${email.toLowerCase()}`)) ?? 0;
  } catch {
    return 0; // fail open
  }
}

async function recordFailure(email: string): Promise<void> {
  if (!redis) return;
  try {
    const key = `login_failures:${email.toLowerCase()}`;
    // Pipeline: incr the counter and set/refresh the expiry in one round-trip.
    // TTL refreshes on each failure — window slides from the most recent attempt.
    const p = redis.pipeline();
    p.incr(key);
    p.expire(key, WINDOW_SECONDS);
    await p.exec();
  } catch {
    // fail open
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: {
    strategy: "jwt",
  },
  providers: [
    // TODO: Add GoogleProvider (Phase 8b) when Google sign-in is built and tested
    // TODO: Add FacebookProvider when FACEBOOK_CLIENT_ID/SECRET are configured
    // TODO: Add AppleProvider when APPLE_CLIENT_ID/SECRET are configured
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Check failure count before any DB query. Throwing surfaces as
        // result.error = "RateLimited" in the client (signIn redirect:false).
        const failures = await getFailureCount(credentials.email);
        if (failures >= MAX_FAILURES) {
          throw new Error("RateLimited");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user?.hashedPassword) {
          await recordFailure(credentials.email);
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );
        if (!isValid) {
          await recordFailure(credentials.email);
          return null;
        }

        // Success — do NOT increment the failure counter.
        return {
          id: user.id,
          email: user.email,
          name: user.displayName ?? user.name,
          image: user.avatarUrl ?? user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }
      // Refresh onboarding flags on sign-in or explicit session update
      if (user || trigger === "update") {
        const userId = (token.id as string | undefined) ?? user?.id;
        if (userId) {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { dateOfBirth: true, hasPickedHandle: true },
          });
          token.ageVerified = !!dbUser?.dateOfBirth;
          token.handleSet = !!dbUser?.hasPickedHandle;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.ageVerified = token.ageVerified as boolean | undefined;
      }
      return session;
    },
  },
};
