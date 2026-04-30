import { describe, it, expect, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// Happy-path test: the Credentials provider `authorize` function correctly
// validates email + password against a hashed password from the database.
// We test the logic in isolation by extracting it, not by calling NextAuth.
// ---------------------------------------------------------------------------

async function authorize(
  credentials: { email: string; password: string } | undefined,
  findUser: (email: string) => Promise<{
    id: string;
    email: string | null;
    hashedPassword: string | null;
    displayName: string | null;
    name: string | null;
    avatarUrl: string | null;
    image: string | null;
  } | null>
) {
  if (!credentials?.email || !credentials?.password) return null;

  const user = await findUser(credentials.email);
  if (!user?.hashedPassword) return null;

  const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);
  if (!isValid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.displayName ?? user.name,
    image: user.avatarUrl ?? user.image,
  };
}

describe("Credentials authorize — happy path", () => {
  const password = "correcthorsebatterystaple";
  let hashedPassword: string;

  beforeEach(async () => {
    hashedPassword = await bcrypt.hash(password, 10);
  });

  it("returns the user object when credentials are correct", async () => {
    const fakeUser = {
      id: "user_1",
      email: "brian@example.com",
      hashedPassword,
      displayName: "Brian",
      name: null,
      avatarUrl: null,
      image: null,
    };

    const result = await authorize(
      { email: "brian@example.com", password },
      async () => fakeUser
    );

    expect(result).toEqual({
      id: "user_1",
      email: "brian@example.com",
      name: "Brian",
      image: null,
    });
  });

  it("returns null when the password is wrong", async () => {
    const fakeUser = {
      id: "user_1",
      email: "brian@example.com",
      hashedPassword,
      displayName: "Brian",
      name: null,
      avatarUrl: null,
      image: null,
    };

    const result = await authorize(
      { email: "brian@example.com", password: "wrongpassword" },
      async () => fakeUser
    );

    expect(result).toBeNull();
  });

  it("returns null when the user is not found", async () => {
    const result = await authorize(
      { email: "ghost@example.com", password },
      async () => null
    );

    expect(result).toBeNull();
  });

  it("returns null when credentials are missing", async () => {
    const result = await authorize(undefined, async () => null);
    expect(result).toBeNull();
  });
});
