// frontend/src/services/auth.ts
// Local persistence of the signed-in user. Storage is injectable so it can be tested
// without a browser, and every read/write is guarded (corrupt JSON, private mode, quota).

// CHQ: Created by Claude AI (Haiku) and modified by Claude AI (Sonnet)

import { AuthUser } from "../types";

export const STORAGE_KEY = "tic_tac_toe_auth";

const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.length > 0;

/** Runtime check that parsed JSON really is an AuthUser. */
export const isAuthUser = (value: unknown): value is AuthUser => {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    isNonEmptyString(v.userId) &&
    typeof v.email === "string" &&
    typeof v.name === "string" &&
    isNonEmptyString(v.sessionJwt)
  );
};

/** localStorage can be missing (SSR/tests) or throw on access (blocked cookies). */
const defaultGetStorage = (): Storage | null => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

export const createAuthStore = (getStorage: () => Storage | null = defaultGetStorage) => {
  const clearAuth = (): void => {
    try {
      getStorage()?.removeItem(STORAGE_KEY);
    } catch {
      /* nothing useful to do */
    }
  };

  /** Returns false if the user could not be persisted. */
  const saveAuthUser = (user: AuthUser): boolean => {
    try {
      const storage = getStorage();
      if (!storage) return false;
      storage.setItem(STORAGE_KEY, JSON.stringify(user));
      return true;
    } catch {
      return false;
    }
  };

  /** Returns null for: nothing stored, unreadable storage, bad JSON, or wrong shape. */
  const getAuthUser = (): AuthUser | null => {
    let raw: string | null;
    try {
      raw = getStorage()?.getItem(STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
    if (raw === null) return null;

    try {
      const parsed: unknown = JSON.parse(raw);
      if (isAuthUser(parsed)) return parsed;
    } catch {
      /* fall through to cleanup */
    }
    clearAuth(); // don't keep re-parsing a bad entry on every request
    return null;
  };

  const isAuthenticated = (): boolean => getAuthUser() !== null;

  return { saveAuthUser, getAuthUser, clearAuth, isAuthenticated };
};

// Default store bound to the real localStorage; existing imports keep working.
const defaultStore = createAuthStore();
export const { saveAuthUser, getAuthUser, clearAuth, isAuthenticated } = defaultStore;