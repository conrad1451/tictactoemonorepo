import { describe, it, expect, vi } from "vitest";
import { AuthUser } from "../types";
import { STORAGE_KEY, createAuthStore, isAuthUser } from "./auth";

const user: AuthUser = { userId: "u1", email: "a@b.c", name: "Ann", sessionJwt: "jwt" };

/** Minimal in-memory Storage. */
const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial));
  const storage = {
    getItem: vi.fn((k: string) => data.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => void data.set(k, v)),
    removeItem: vi.fn((k: string) => void data.delete(k)),
    clear: () => data.clear(),
    key: () => null,
    get length() {
      return data.size;
    },
  };
  return { storage: storage as unknown as Storage, data };
};

const storeWith = (initial?: Record<string, string>) => {
  const mem = memoryStorage(initial);
  return { ...mem, store: createAuthStore(() => mem.storage) };
};

describe("isAuthUser", () => {
  it("accepts a complete user", () => expect(isAuthUser(user)).toBe(true));

  it.each([
    ["null", null],
    ["a string", "x"],
    ["an array", []],
    ["missing sessionJwt", { ...user, sessionJwt: undefined }],
    ["empty sessionJwt", { ...user, sessionJwt: "" }],
    ["empty userId", { ...user, userId: "" }],
    ["non-string name", { ...user, name: 5 }],
  ])("rejects %s", (_label, value) => expect(isAuthUser(value)).toBe(false));

  it("allows empty email/name (Descope may omit them)", () => {
    expect(isAuthUser({ ...user, email: "", name: "" })).toBe(true);
  });
});

describe("auth store", () => {
  it("round-trips a user", () => {
    const { store } = storeWith();
    expect(store.saveAuthUser(user)).toBe(true);
    expect(store.getAuthUser()).toEqual(user);
  });

  it("returns null when nothing is stored", () => {
    expect(storeWith().store.getAuthUser()).toBeNull();
  });

  it("clearAuth removes the user", () => {
    const { store } = storeWith();
    store.saveAuthUser(user);
    store.clearAuth();
    expect(store.getAuthUser()).toBeNull();
  });

  it("isAuthenticated reflects stored state", () => {
    const { store } = storeWith();
    expect(store.isAuthenticated()).toBe(false);
    store.saveAuthUser(user);
    expect(store.isAuthenticated()).toBe(true);
  });

  describe("bad stored data", () => {
    it("returns null (no throw) for corrupted JSON and removes the entry", () => {
      const { store, data } = storeWith({ [STORAGE_KEY]: "{not json" });
      expect(store.getAuthUser()).toBeNull();
      expect(data.has(STORAGE_KEY)).toBe(false);
    });

    it("returns null and cleans up for valid JSON of the wrong shape", () => {
      const { store, data } = storeWith({ [STORAGE_KEY]: JSON.stringify({ foo: 1 }) });
      expect(store.getAuthUser()).toBeNull();
      expect(data.has(STORAGE_KEY)).toBe(false);
    });

    it("treats the literal string 'null' as signed out", () => {
      expect(storeWith({ [STORAGE_KEY]: "null" }).store.getAuthUser()).toBeNull();
    });
  });

  describe("unavailable or failing storage", () => {
    it("works as signed-out when there is no storage", () => {
      const store = createAuthStore(() => null);
      expect(store.getAuthUser()).toBeNull();
      expect(store.saveAuthUser(user)).toBe(false);
      expect(() => store.clearAuth()).not.toThrow();
    });

    it("returns false when setItem throws (quota / private mode)", () => {
      const { storage } = memoryStorage();
      (storage.setItem as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
      expect(createAuthStore(() => storage).saveAuthUser(user)).toBe(false);
    });

    it("returns null when getItem throws", () => {
      const { storage } = memoryStorage();
      (storage.getItem as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("SecurityError");
      });
      expect(createAuthStore(() => storage).getAuthUser()).toBeNull();
    });

    it("returns null when accessing storage itself throws", () => {
      const store = createAuthStore(() => {
        throw new Error("blocked");
      });
      expect(store.getAuthUser()).toBeNull();
    });
  });
});