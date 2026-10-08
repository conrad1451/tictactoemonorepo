import { describe, it, expect } from "vitest";
import { mapDescopeSuccess } from "./descope";

const user = { userId: "u1", email: "a@b.c", name: "Ann" };

describe("mapDescopeSuccess", () => {
  it("maps a complete success event", () => {
    expect(mapDescopeSuccess({ user, sessionJwt: "jwt" }, undefined, null)).toEqual({
      userId: "u1",
      email: "a@b.c",
      name: "Ann",
      sessionJwt: "jwt",
    });
  });

  describe("user source", () => {
    it("prefers the event's user over the SDK user", () => {
      const result = mapDescopeSuccess({ user, sessionJwt: "j" }, { userId: "other", name: "Bob" }, null);
      expect(result?.userId).toBe("u1");
    });

    it("falls back to the SDK user when the event has none", () => {
      const result = mapDescopeSuccess({ sessionJwt: "j" }, { userId: "sdk1", name: "Sam" }, null);
      expect(result).toMatchObject({ userId: "sdk1", name: "Sam" });
    });

    it("works with no event detail at all", () => {
      expect(mapDescopeSuccess(undefined, user, "tok")).toMatchObject({ userId: "u1", sessionJwt: "tok" });
    });
  });

  describe("session token", () => {
    it("falls back to the provided token when the event has none", () => {
      expect(mapDescopeSuccess({ user }, undefined, "fallback")?.sessionJwt).toBe("fallback");
    });

    it("treats an empty event token as missing", () => {
      expect(mapDescopeSuccess({ user, sessionJwt: "" }, undefined, "fallback")?.sessionJwt).toBe("fallback");
    });

    it.each([null, undefined, ""])("returns null when there is no token anywhere (%s)", (fallback) => {
      expect(mapDescopeSuccess({ user }, undefined, fallback)).toBeNull();
    });
  });

  describe("user id", () => {
    it("prefers userId, then sub, then the first loginId", () => {
      const detail = (u: object) => mapDescopeSuccess({ user: u, sessionJwt: "j" }, undefined, null)?.userId;
      expect(detail({ userId: "a", sub: "b", loginIds: ["c"] })).toBe("a");
      expect(detail({ sub: "b", loginIds: ["c"] })).toBe("b");
      expect(detail({ loginIds: ["c", "d"] })).toBe("c");
    });

    it("returns null when no id can be found (it would not survive a reload)", () => {
      expect(mapDescopeSuccess({ user: { email: "a@b.c" }, sessionJwt: "j" }, undefined, null)).toBeNull();
    });
  });

  describe("display fields", () => {
    const map = (u: object) => mapDescopeSuccess({ user: { userId: "u1", ...u }, sessionJwt: "j" }, undefined, null)!;

    it("uses the name when present", () => expect(map({ name: "Ann", email: "a@b.c" }).name).toBe("Ann"));
    it("falls back to the email", () => expect(map({ email: "a@b.c" }).name).toBe("a@b.c"));
    it("falls back to 'Player'", () => expect(map({}).name).toBe("Player"));
    it("treats an empty name as missing", () => expect(map({ name: "", email: "a@b.c" }).name).toBe("a@b.c"));
    it("defaults a missing email to an empty string", () => expect(map({}).email).toBe(""));
  });
});
