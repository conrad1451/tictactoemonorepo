// frontend/src/utils/username.ts
// Copy of backend/src/utils/username.ts, used for instant feedback. The server is the authority: keep the two in sync.

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

const ALLOWED = /^[A-Za-z0-9_-]+$/;

// Compared case-insensitively.
const RESERVED = new Set([
  "admin", "administrator", "anonymous", "api", "guest", "mod",
  "moderator", "null", "root", "support", "system", "undefined", "user",
]);

export type UsernameCheck =
  | { ok: true; username: string; key: string }
  | { ok: false; error: string };

/** `key` is the lowercase form used for case-insensitive uniqueness. */
export const validateUsername = (raw: unknown): UsernameCheck => {
  if (typeof raw !== "string" || raw.trim() === "") {
    return { ok: false, error: "Username is required." };
  }
  const username = raw.trim();

  if (username.length < USERNAME_MIN) {
    return { ok: false, error: `Username must be at least ${USERNAME_MIN} characters.` };
  }
  if (username.length > USERNAME_MAX) {
    return { ok: false, error: `Username must be ${USERNAME_MAX} characters or fewer.` };
  }
  if (!ALLOWED.test(username)) {
    return { ok: false, error: "Use only letters, numbers, underscores and hyphens." };
  }
  const key = username.toLowerCase();
  if (RESERVED.has(key)) {
    return { ok: false, error: "That username isn't available." };
  }
  return { ok: true, username, key };
};
