import { describe, it, expect } from "vitest";
import { isDuplicateKeyError } from "./mongoErrors.js";

describe("isDuplicateKeyError", () => {
  it("is true for code 11000", () => {
    expect(isDuplicateKeyError({ code: 11000 })).toBe(true);
  });

  it.each([null, undefined, "boom", 11000, {}, { code: 121 }, new Error("x")])("is false for %j", (err) => {
    expect(isDuplicateKeyError(err)).toBe(false);
  });

  describe("with a field", () => {
    it("matches when keyPattern names the field", () => {
      expect(isDuplicateKeyError({ code: 11000, keyPattern: { usernameLower: 1 } }, "usernameLower")).toBe(true);
    });

    it("does not match a collision on a different index (e.g. _id from concurrent upserts)", () => {
      expect(isDuplicateKeyError({ code: 11000, keyPattern: { _id: 1 } }, "usernameLower")).toBe(false);
    });

    it("falls back to the message when keyPattern is missing", () => {
      const msg = "E11000 duplicate key error collection: db.users index: usernameLower_1 dup key";
      expect(isDuplicateKeyError({ code: 11000, message: msg }, "usernameLower")).toBe(true);
      expect(isDuplicateKeyError({ code: 11000, message: "E11000 index: _id_" }, "usernameLower")).toBe(false);
    });

    it("is false when it isn't a duplicate-key error at all", () => {
      expect(isDuplicateKeyError({ code: 1, keyPattern: { usernameLower: 1 } }, "usernameLower")).toBe(false);
    });
  });
});
