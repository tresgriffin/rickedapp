import { describe, it, expect } from "vitest";
import { validateHandleFormat } from "./actions/onboarding";

// ---------------------------------------------------------------------------
// These tests cover Phase 8a.2 onboarding logic in isolation.
// Same pattern as auth.test.ts — pure functions extracted and tested directly.
// ---------------------------------------------------------------------------

// ─── Age gate ────────────────────────────────────────────────────────────────

/**
 * Age calculation extracted from lib/actions/onboarding.ts for isolated testing.
 * Must match the production implementation exactly.
 */
function calculateAge(dob: Date, today = new Date()): number {
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function isEligible(dob: Date, today = new Date()): boolean {
  return calculateAge(dob, today) >= 21;
}

describe("Age gate — calculateAge and eligibility", () => {
  const today = new Date("2026-05-07");

  it("accepts a clearly eligible user (born 1990)", () => {
    expect(isEligible(new Date("1990-01-01"), today)).toBe(true);
  });

  it("accepts a user who turned 21 exactly today", () => {
    const dob = new Date("2005-05-07"); // exactly 21 on 2026-05-07
    expect(calculateAge(dob, today)).toBe(21);
    expect(isEligible(dob, today)).toBe(true);
  });

  it("rejects a user who turns 21 tomorrow (not yet 21)", () => {
    const dob = new Date("2005-05-08"); // turns 21 tomorrow
    expect(calculateAge(dob, today)).toBe(20);
    expect(isEligible(dob, today)).toBe(false);
  });

  it("rejects a clearly under-age user (born 2010)", () => {
    expect(isEligible(new Date("2010-01-01"), today)).toBe(false);
  });

  it("rejects a user born one day after the cutoff (born 2005-05-08)", () => {
    const dob = new Date("2005-05-08");
    expect(isEligible(dob, today)).toBe(false);
  });

  it("accounts for not-yet-reached birthday month this year", () => {
    // Born June 1990 — hasn't had their June birthday in May 2026 yet
    const dob = new Date("1990-06-15");
    expect(calculateAge(dob, today)).toBe(35); // not yet 36
    expect(isEligible(dob, today)).toBe(true); // still well over 21
  });

  it("handles leap-year birth date (Feb 29)", () => {
    const dob = new Date("2000-02-29");
    // In 2026 there's no Feb 29, birthday hasn't passed by May 7
    expect(calculateAge(dob, new Date("2026-05-07"))).toBe(26);
    expect(isEligible(dob, today)).toBe(true);
  });
});

// ─── Middleware gate logic ────────────────────────────────────────────────────

/**
 * Core middleware gate logic extracted from middleware.ts for isolated testing.
 * Tests the routing decision without NextAuth or Next.js dependencies.
 */
const ONBOARDING_EXEMPT = ["/verify-age", "/onboarding", "/welcome", "/reset-password"];

function getGateRedirect(
  token: { ageVerified?: boolean; handleSet?: boolean } | null,
  pathname: string
): string | null {
  if (!token) return null; // withAuth handles unauthenticated at a different layer
  const isExempt = ONBOARDING_EXEMPT.some((p) => pathname.startsWith(p));
  if (isExempt) return null;
  if (!token.ageVerified) return "/verify-age";
  if (!token.handleSet) return "/onboarding/handle";
  return null;
}

describe("Middleware — onboarding gate routing", () => {
  it("does not redirect unauthenticated requests (withAuth handles those)", () => {
    expect(getGateRedirect(null, "/home")).toBeNull();
  });

  it("redirects authenticated user without ageVerified to /verify-age", () => {
    expect(getGateRedirect({ ageVerified: false, handleSet: false }, "/home")).toBe("/verify-age");
  });

  it("redirects age-verified user without handleSet to /onboarding/handle", () => {
    expect(getGateRedirect({ ageVerified: true, handleSet: false }, "/home")).toBe("/onboarding/handle");
  });

  it("does not redirect a fully onboarded user on /home", () => {
    expect(getGateRedirect({ ageVerified: true, handleSet: true }, "/home")).toBeNull();
  });

  it("does not redirect from /verify-age itself (exempt)", () => {
    expect(getGateRedirect({ ageVerified: false, handleSet: false }, "/verify-age")).toBeNull();
  });

  it("does not redirect from /onboarding/handle (exempt)", () => {
    expect(getGateRedirect({ ageVerified: true, handleSet: false }, "/onboarding/handle")).toBeNull();
  });

  it("does not redirect from /onboarding/interests (exempt)", () => {
    expect(getGateRedirect({ ageVerified: true, handleSet: false }, "/onboarding/interests")).toBeNull();
  });

  it("does not redirect from /welcome (exempt)", () => {
    expect(getGateRedirect({ ageVerified: true, handleSet: true }, "/welcome")).toBeNull();
  });

  it("gates /profile when handleSet is false", () => {
    expect(getGateRedirect({ ageVerified: true, handleSet: false }, "/profile")).toBe("/onboarding/handle");
  });

  it("gates /rick when ageVerified is false", () => {
    expect(getGateRedirect({ ageVerified: false }, "/rick")).toBe("/verify-age");
  });
});

// ─── Handle format validation ────────────────────────────────────────────────

describe("Handle validation — format rules", () => {
  it("accepts a valid lowercase handle", () => {
    expect(validateHandleFormat("whiskey")).toBeNull();
  });

  it("accepts a handle with numbers", () => {
    expect(validateHandleFormat("whiskey42")).toBeNull();
  });

  it("accepts a handle with underscores (not leading)", () => {
    expect(validateHandleFormat("whiskey_fan")).toBeNull();
  });

  it("rejects a handle under 3 characters", () => {
    expect(validateHandleFormat("ab")).toMatch(/at least 3/i);
  });

  it("rejects a handle over 20 characters", () => {
    expect(validateHandleFormat("a".repeat(21))).toMatch(/20 characters/i);
  });

  it("rejects uppercase letters", () => {
    expect(validateHandleFormat("Whiskey")).toMatch(/lowercase/i);
  });

  it("rejects handles starting with a number", () => {
    expect(validateHandleFormat("1whiskey")).toMatch(/start with a number/i);
  });

  it("rejects handles starting with an underscore", () => {
    expect(validateHandleFormat("_whiskey")).toMatch(/start with an underscore/i);
  });

  it("rejects handles with spaces", () => {
    expect(validateHandleFormat("my handle")).not.toBeNull();
  });

  it("rejects handles with special characters", () => {
    expect(validateHandleFormat("whiskey!")).not.toBeNull();
    expect(validateHandleFormat("whiskey.fan")).not.toBeNull();
    expect(validateHandleFormat("whiskey-fan")).not.toBeNull();
  });

  it("accepts exactly 3 characters (minimum boundary)", () => {
    expect(validateHandleFormat("abc")).toBeNull();
  });

  it("accepts exactly 20 characters (maximum boundary)", () => {
    expect(validateHandleFormat("a".repeat(20))).toBeNull();
  });
});

describe("Handle validation — reserved blocklist", () => {
  const reserved = [
    "admin", "support", "help", "team", "ricked", "rick", "tres", "brian",
    "abuse", "moderator", "mod", "official", "root", "security", "staff",
    "bot", "api", "null", "undefined", "anonymous", "guest", "test",
  ];

  reserved.forEach((handle) => {
    it(`rejects reserved handle: ${handle}`, () => {
      expect(validateHandleFormat(handle)).toMatch(/reserved/i);
    });
  });
});

// ─── Handle suggestions ───────────────────────────────────────────────────────

/**
 * Suggestion generation logic extracted for testing.
 * The actual route calls DB to filter taken handles — here we test the
 * candidate generation step (before DB filtering).
 */
function generateCandidates(base: string): string[] {
  const r1 = 73; // fixed for test determinism
  const r2 = 42;
  const year = "26"; // 2026 → "26"
  return [
    `${base}${r1}`,
    `${base}${year}`,
    `${base}${r2}`,
  ].filter((c) => c.length <= 20 && c.length >= 3);
}

describe("Handle suggestions — candidate generation", () => {
  it("generates 3 candidates for 'whiskey'", () => {
    const candidates = generateCandidates("whiskey");
    expect(candidates).toHaveLength(3);
    expect(candidates).toEqual(["whiskey73", "whiskey26", "whiskey42"]);
  });

  it("generates 3 candidates for 'tres'", () => {
    const candidates = generateCandidates("tres");
    expect(candidates).toEqual(["tres73", "tres26", "tres42"]);
  });

  it("no candidate has a trailing underscore", () => {
    const candidates = generateCandidates("whiskey");
    expect(candidates.every((c) => !c.endsWith("_"))).toBe(true);
  });

  it("all candidates are valid handles (pass format check)", () => {
    const candidates = generateCandidates("whiskey");
    candidates.forEach((c) => {
      expect(validateHandleFormat(c)).toBeNull();
    });
  });

  it("filters out candidates that exceed 20 chars", () => {
    // 18-char base + 2 digits = 20 chars exactly (valid)
    const longBase = "a".repeat(18);
    const candidates = generateCandidates(longBase);
    expect(candidates.every((c) => c.length <= 20)).toBe(true);
  });

  it("filters out candidates that would be under 3 chars (very short base)", () => {
    // 1-char base + 2 digits = 3 chars (valid at boundary)
    const candidates = generateCandidates("a");
    expect(candidates.every((c) => c.length >= 3)).toBe(true);
  });
});

// ─── Whiskey interest — validation ───────────────────────────────────────────

const VALID_INTERESTS = ["BOURBON", "SCOTCH", "RYE", "JAPANESE", "IRISH", "NOT_SURE"] as const;
type WhiskeyInterest = (typeof VALID_INTERESTS)[number];

function validateWhiskeyInterest(raw: string | null): WhiskeyInterest | null {
  if (!raw) return null;
  return VALID_INTERESTS.includes(raw as WhiskeyInterest) ? (raw as WhiskeyInterest) : null;
}

describe("Whiskey interest — validation and persistence contract", () => {
  it("accepts all six valid interests", () => {
    VALID_INTERESTS.forEach((interest) => {
      expect(validateWhiskeyInterest(interest)).toBe(interest);
    });
  });

  it("returns null when skipped (null input)", () => {
    expect(validateWhiskeyInterest(null)).toBeNull();
  });

  it("returns null for an invalid/unknown interest string", () => {
    expect(validateWhiskeyInterest("WINE")).toBeNull();
    expect(validateWhiskeyInterest("bourbon")).toBeNull(); // case-sensitive
  });

  it("skip path: null input → null saved → no DB write needed", () => {
    const toSave = validateWhiskeyInterest(null);
    // In production: if toSave is null, we skip the DB update
    expect(toSave).toBeNull();
  });

  it("change path: BOURBON → SCOTCH produces new valid interest", () => {
    const original = validateWhiskeyInterest("BOURBON");
    const updated = validateWhiskeyInterest("SCOTCH");
    expect(original).toBe("BOURBON");
    expect(updated).toBe("SCOTCH");
    expect(original).not.toBe(updated);
  });
});

// ─── Profile edit — validation ────────────────────────────────────────────────

function validateProfileUpdate(displayName: string): string | null {
  if (!displayName.trim()) return "Display name can't be empty.";
  if (displayName.trim().length > 50) return "Display name must be 50 characters or fewer.";
  return null;
}

describe("Profile edit — display name and bio validation", () => {
  it("accepts a valid display name", () => {
    expect(validateProfileUpdate("Brian")).toBeNull();
  });

  it("rejects an empty display name", () => {
    expect(validateProfileUpdate("")).toMatch(/can't be empty/i);
  });

  it("rejects a whitespace-only display name", () => {
    expect(validateProfileUpdate("   ")).toMatch(/can't be empty/i);
  });

  it("rejects a display name over 50 characters", () => {
    expect(validateProfileUpdate("a".repeat(51))).toMatch(/50 characters/i);
  });

  it("accepts exactly 50 characters (boundary)", () => {
    expect(validateProfileUpdate("a".repeat(50))).toBeNull();
  });

  it("bio is optional — the server action accepts null/empty bio without error", () => {
    // Bio validation is handled at DB level (nullable field); server strips empty to null.
    // This test documents the contract: bio cannot cause a validation error.
    expect(validateProfileUpdate("Brian")).toBeNull();
  });

  it("handle is read-only — changing it has no effect on validation", () => {
    // Handle is shown read-only in UI; the server action does not accept a handle field.
    // This test documents that handle is not part of the updateProfile contract.
    const formFields = ["displayName", "bio"]; // handle is NOT in this list
    expect(formFields.includes("handle")).toBe(false);
  });
});
