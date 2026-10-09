import { describe, it, expect } from "vitest";
import { pickProfile } from "./profile.js";

describe("pickProfile", () => {
  it("keeps non-empty name and email, trimmed", () => {
    expect(pickProfile({ name: " Ann ", email: "a@b.c " })).toEqual({ name: "Ann", email: "a@b.c" });
  });

  it("drops blank values so they never overwrite stored data", () => {
    expect(pickProfile({ name: "", email: "   " })).toEqual({});
    expect(pickProfile({ name: "Ann", email: "" })).toEqual({ name: "Ann" });
  });

  it("drops non-strings", () => {
    expect(pickProfile({ name: 5, email: null })).toEqual({});
  });

  it.each([undefined, null])("handles %s", (u) => expect(pickProfile(u)).toEqual({}));
});
