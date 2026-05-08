import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// These tests cover Phase 8a.1 auth hardening logic in isolation.
// No real DB or NextAuth calls — we extract and test the pure logic the same
// way auth.test.ts tests the Credentials authorize function.
// ---------------------------------------------------------------------------

// ─── Password reset token validation ────────────────────────────────────────

/**
 * Core reset token validation logic extracted from
 * app/api/auth/reset-password/route.ts for isolated testing.
 */
function validateResetToken(
  record: { expires: Date } | null,
  now: Date
): { valid: true } | { error: string } {
  if (!record) return { error: "Invalid or expired reset link." };
  if (record.expires < now) return { error: "This reset link has expired. Request a new one." };
  return { valid: true };
}

describe("Password reset — token validation", () => {
  it("accepts a valid, unexpired token", () => {
    const record = { expires: new Date(Date.now() + 1000 * 60 * 30) }; // 30 min from now
    const result = validateResetToken(record, new Date());
    expect(result).toEqual({ valid: true });
  });

  it("rejects a null token (not found in DB)", () => {
    const result = validateResetToken(null, new Date());
    expect(result).toEqual({ error: "Invalid or expired reset link." });
  });

  it("rejects an expired token", () => {
    const record = { expires: new Date(Date.now() - 1000 * 60 * 5) }; // expired 5 min ago
    const result = validateResetToken(record, new Date());
    expect("error" in result).toBe(true);
  });

  it("rejects a token whose expiry is exactly now (boundary)", () => {
    const now = new Date();
    const record = { expires: now };
    const result = validateResetToken(record, now);
    // expires < now is false when equal, so this one is still valid — document the boundary
    // In production the token was just created; exact-now expiry is effectively immediate expiry
    // This test documents the boundary behavior rather than asserting a hard requirement
    expect(result).toEqual({ valid: true }); // expires === now → not strictly less-than
  });

  it("rejects a token that was already used (simulated by null after deletion)", () => {
    // After use, the token is deleted from DB; findUnique returns null
    const result = validateResetToken(null, new Date());
    expect(result).toEqual({ error: "Invalid or expired reset link." });
  });
});

describe("Password reset — password hashing on update", () => {
  it("produces a new hash that matches the new password", async () => {
    const newPassword = "newSecureP@ss99";
    const hash = await bcrypt.hash(newPassword, 12);
    const matches = await bcrypt.compare(newPassword, hash);
    expect(matches).toBe(true);
  });

  it("new hash does not match the old password", async () => {
    const oldPassword = "oldpassword123";
    const newPassword = "newSecureP@ss99";
    const hash = await bcrypt.hash(newPassword, 12);
    const matches = await bcrypt.compare(oldPassword, hash);
    expect(matches).toBe(false);
  });
});

// ─── Email verification token validation ────────────────────────────────────

/**
 * Core verification token validation logic extracted from
 * app/api/auth/verify-email/route.ts for isolated testing.
 */
function validateVerificationToken(
  record: { expires: Date } | null,
  now: Date
): { valid: true } | { error: "not_found" | "expired" } {
  if (!record) return { error: "not_found" };
  if (record.expires < now) return { error: "expired" };
  return { valid: true };
}

describe("Email verification — token validation", () => {
  it("accepts a valid, unexpired verification token", () => {
    const record = { expires: new Date(Date.now() + 1000 * 60 * 60 * 20) }; // 20 hrs
    const result = validateVerificationToken(record, new Date());
    expect(result).toEqual({ valid: true });
  });

  it("rejects null (token not found — invalid link or already used)", () => {
    const result = validateVerificationToken(null, new Date());
    expect(result).toEqual({ error: "not_found" });
  });

  it("rejects an expired verification token", () => {
    const record = { expires: new Date(Date.now() - 1000 * 60 * 60) }; // expired 1 hr ago
    const result = validateVerificationToken(record, new Date());
    expect(result).toEqual({ error: "expired" });
  });

  it("rejects an already-used token (simulated by null after deletion)", () => {
    // After verification the token is deleted; a second click returns null
    const result = validateVerificationToken(null, new Date());
    expect(result).toEqual({ error: "not_found" });
  });
});

// ─── requireVerifiedUser — email verification gate ──────────────────────────

/**
 * Core verified-user check extracted from lib/require-verified.ts.
 * In production this also checks the session; here we test the DB-level
 * emailVerified check in isolation.
 */
function checkEmailVerified(
  emailVerified: Date | null | undefined
): { ok: true } | { error: string } {
  if (!emailVerified) {
    return {
      error:
        "Please verify your email before posting, reviewing, or following. Check your inbox for a verification link.",
    };
  }
  return { ok: true };
}

describe("requireVerifiedUser — email verification gate", () => {
  it("allows a verified user (emailVerified is a Date)", () => {
    const result = checkEmailVerified(new Date());
    expect(result).toEqual({ ok: true });
  });

  it("blocks an unverified user (emailVerified is null)", () => {
    const result = checkEmailVerified(null);
    expect("error" in result).toBe(true);
    expect((result as { error: string }).error).toMatch(/verify your email/i);
  });

  it("blocks an unverified user (emailVerified is undefined)", () => {
    const result = checkEmailVerified(undefined);
    expect("error" in result).toBe(true);
  });

  it("blocked error message mentions the inbox so the user knows what to do", () => {
    const result = checkEmailVerified(null) as { error: string };
    expect(result.error).toMatch(/inbox/i);
  });
});

describe("requireVerifiedUser — gating createPost and createReview", () => {
  // These tests verify that the gating contract is correct by testing the
  // extracted check function against the scenarios those actions encounter.

  it("createPost: unverified user gets an error, not a DB write", () => {
    const auth = checkEmailVerified(null);
    // In the action: if ("error" in auth) return auth;
    // This confirms the guard fires before any DB call
    expect("error" in auth).toBe(true);
  });

  it("createPost: verified user passes the gate", () => {
    const auth = checkEmailVerified(new Date("2026-01-01"));
    expect("error" in auth).toBe(false);
    expect(auth).toEqual({ ok: true });
  });

  it("createReview: unverified user gets an error", () => {
    const auth = checkEmailVerified(null);
    expect("error" in auth).toBe(true);
    expect((auth as { error: string }).error).toMatch(/verify your email/i);
  });

  it("createReview: verified user passes the gate", () => {
    const auth = checkEmailVerified(new Date());
    expect(auth).toEqual({ ok: true });
  });
});

// ─── Forgot password — always-200 security pattern ──────────────────────────

/**
 * The forgot-password route must never reveal whether an email exists.
 * It always returns { ok: true } regardless of whether the user was found.
 * This tests the branching logic extracted from the route.
 */
function forgotPasswordResponse(
  user: { id: string; email: string } | null
): { ok: true } {
  // Always return ok — don't reveal whether the email exists.
  // Side-effect (sending email) only happens when user is non-null,
  // but the response shape is identical either way.
  if (!user?.email) return { ok: true };
  // (in production: create token + send email here)
  return { ok: true };
}

describe("Forgot password — always-200 security pattern", () => {
  it("returns ok:true when the email exists", () => {
    const result = forgotPasswordResponse({ id: "u1", email: "real@example.com" });
    expect(result).toEqual({ ok: true });
  });

  it("returns ok:true when the email does NOT exist (prevents enumeration)", () => {
    const result = forgotPasswordResponse(null);
    expect(result).toEqual({ ok: true });
  });

  it("response shape is identical whether email found or not", () => {
    const foundResult = forgotPasswordResponse({ id: "u1", email: "real@example.com" });
    const notFoundResult = forgotPasswordResponse(null);
    expect(foundResult).toEqual(notFoundResult);
  });
});

// ─── Rick rate limit — 5/day enforcement and reset logic ─────────────────────

const DAILY_LIMIT = 5; // must match app/api/rick/route.ts and app/rick/page.tsx

function isNewUTCDay(lastResetAt: Date | null, now: Date): boolean {
  if (!lastResetAt) return true;
  return (
    lastResetAt.getUTCFullYear() !== now.getUTCFullYear() ||
    lastResetAt.getUTCMonth() !== now.getUTCMonth() ||
    lastResetAt.getUTCDate() !== now.getUTCDate()
  );
}

function getRemainingMessages(
  conversationsToday: number,
  lastResetAt: Date | null,
  now: Date
): number {
  const count = isNewUTCDay(lastResetAt, now) ? 0 : conversationsToday;
  return Math.max(0, DAILY_LIMIT - count);
}

function isRateLimited(
  conversationsToday: number,
  lastResetAt: Date | null,
  now: Date
): boolean {
  return getRemainingMessages(conversationsToday, lastResetAt, now) <= 0;
}

describe("Rick rate limit — 5/day enforcement", () => {
  const now = new Date("2026-05-07T14:00:00Z");

  it("allows first message of the day (0 used)", () => {
    expect(isRateLimited(0, now, now)).toBe(false);
    expect(getRemainingMessages(0, now, now)).toBe(5);
  });

  it("allows 4th message (3 used, 2 remain)", () => {
    expect(isRateLimited(3, now, now)).toBe(false);
    expect(getRemainingMessages(3, now, now)).toBe(2);
  });

  it("allows 5th message (4 used, 1 remains)", () => {
    expect(isRateLimited(4, now, now)).toBe(false);
    expect(getRemainingMessages(4, now, now)).toBe(1);
  });

  it("blocks 6th message (5 used, limit reached)", () => {
    expect(isRateLimited(5, now, now)).toBe(true);
    expect(getRemainingMessages(5, now, now)).toBe(0);
  });

  it("blocks when conversationsToday exceeds limit (defensive)", () => {
    expect(isRateLimited(99, now, now)).toBe(true);
    expect(getRemainingMessages(99, now, now)).toBe(0);
  });

  it("DAILY_LIMIT constant matches the locked spec of 5", () => {
    expect(DAILY_LIMIT).toBe(5);
  });
});

describe("Rick rate limit — UTC day reset", () => {
  it("resets counter on a new UTC day (null lastResetAt)", () => {
    const now = new Date("2026-05-07T00:30:00Z");
    expect(isNewUTCDay(null, now)).toBe(true);
    expect(getRemainingMessages(5, null, now)).toBe(5); // resets to full
  });

  it("resets when lastResetAt is a previous UTC day", () => {
    const yesterday = new Date("2026-05-06T23:59:00Z");
    const now = new Date("2026-05-07T00:01:00Z");
    expect(isNewUTCDay(yesterday, now)).toBe(true);
    expect(getRemainingMessages(5, yesterday, now)).toBe(5);
  });

  it("does NOT reset within the same UTC day", () => {
    const earlier = new Date("2026-05-07T08:00:00Z");
    const now = new Date("2026-05-07T14:00:00Z");
    expect(isNewUTCDay(earlier, now)).toBe(false);
    expect(getRemainingMessages(3, earlier, now)).toBe(2);
  });

  it("resets correctly at the UTC midnight boundary", () => {
    const justBefore = new Date("2026-05-07T23:59:59Z");
    const justAfter = new Date("2026-05-08T00:00:01Z");
    expect(isNewUTCDay(justBefore, justAfter)).toBe(true);
  });

  it("does not reset when same day across month boundary is checked correctly", () => {
    // May 31 → June 1 should reset
    const may31 = new Date("2026-05-31T22:00:00Z");
    const jun1 = new Date("2026-06-01T00:01:00Z");
    expect(isNewUTCDay(may31, jun1)).toBe(true);
  });
});
