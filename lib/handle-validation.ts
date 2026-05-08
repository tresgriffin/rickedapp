// Pure validation utilities — no "use server", safe to import from client or server

export const RESERVED_HANDLES = new Set([
  // Brand / team
  "admin", "support", "help", "team", "ricked", "rick", "tres", "brian",
  // Common abuse vectors
  "abuse", "billing", "contact", "info", "mail", "moderator", "mod",
  "official", "postmaster", "root", "security", "staff", "sys", "webmaster",
  "bot", "api", "null", "undefined", "anonymous", "guest", "test",
]);

export function validateHandleFormat(handle: string): string | null {
  if (handle.length < 3) return "Must be at least 3 characters.";
  if (handle.length > 20) return "Must be 20 characters or fewer.";
  if (!/^[a-z][a-z0-9_]*$/.test(handle)) {
    if (/[A-Z]/.test(handle)) return "Lowercase only.";
    if (/^\d/.test(handle)) return "Can't start with a number.";
    if (/^_/.test(handle)) return "Can't start with an underscore.";
    return "Letters, numbers, and underscores only.";
  }
  if (RESERVED_HANDLES.has(handle)) return "That handle is reserved.";
  return null;
}
