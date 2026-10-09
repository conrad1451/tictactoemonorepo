import { describe, it, expect } from "vitest";
import { USERNAME_MAX, USERNAME_MIN, validateUsername } from "./username.js";

describe("validateUsername", () => {
  describe("accepts", () => {
    it.each(["ann", "Ann_T", "a-b-c", "player_42", "A".repeat(USERNAME_MAX), "x".repeat(USERNAME_MIN)])(
      "%s",
      (name) => expect(validateUsername(name).ok).toBe(true)
    );

    it("trims surrounding whitespace", () => {
      expect(validateUsername("  Ann_T  ")).toEqual({ ok: true, username: "Ann_T", key: "ann_t" });
    });

    it("returns a lowercase key for case-insensitive uniqueness", () => {
      const a = validateUsername("Ann");
      const b = validateUsername("aNN");
      expect(a.ok && b.ok && a.key === b.key).toBe(true);
    });
  });

  describe("rejects", () => {
    it.each([undefined, null, 42, {}, [], "", "   "])("non-string or empty (%j)", (raw) => {
      expect(validateUsername(raw)).toEqual({ ok: false, error: "Username is required." });
    });

    it("too short", () => {
      expect(validateUsername("ab")).toEqual({ ok: false, error: "Username must be at least 3 characters." });
    });

    it("too long", () => {
      expect(validateUsername("a".repeat(USERNAME_MAX + 1))).toEqual({
        ok: false,
        error: "Username must be 20 characters or fewer.",
      });
    });

    it.each(["a@b.com", "has space", "emoji😀x", "semi;colon", "dot.name", "ünïcode", "a/b/c"])(
      "disallowed characters (%s)",
      (name) => {
        expect(validateUsername(name)).toEqual({
          ok: false,
          error: "Use only letters, numbers, underscores and hyphens.",
        });
      }
    );

    it.each(["admin", "Admin", "ANONYMOUS", "user", "null", "root"])("reserved word (%s)", (name) => {
      expect(validateUsername(name)).toEqual({ ok: false, error: "That username isn't available." });
    });

    it("does not treat names that merely contain a reserved word as reserved", () => {
      expect(validateUsername("admin_fan").ok).toBe(true);
    });
  });
});
