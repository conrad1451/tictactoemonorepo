// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { UserProfile } from "../types";
import { ApiError } from "../services/apiClient";
import { ProfileApi, useProfile } from "./useProfile";

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const profile = (username: string | null, userId = "u1"): UserProfile => ({ userId, username });

const fakeApi = (overrides: Partial<ProfileApi> = {}): ProfileApi => ({
  getMe: vi.fn().mockResolvedValue(profile(null)),
  setUsername: vi.fn(async (username: string) => profile(username)),
  ...overrides,
});

const settle = () => act(async () => {});

describe("useProfile: loading", () => {
  it("does nothing while signed out", async () => {
    const api = fakeApi();
    const { result } = renderHook(() => useProfile(null, api));
    await settle();
    expect(api.getMe).not.toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
    expect(result.current.needsUsername).toBe(false);
  });

  it("loads the saved username", async () => {
    const api = fakeApi({ getMe: vi.fn().mockResolvedValue(profile("Ann_T")) });
    const { result } = renderHook(() => useProfile("u1", api));
    expect(result.current.status).toBe("loading");
    await settle();
    expect(result.current.username).toBe("Ann_T");
    expect(result.current.status).toBe("ready");
    expect(result.current.needsUsername).toBe(false);
  });

  it("asks for a username when the player has none", async () => {
    const { result } = renderHook(() => useProfile("u1", fakeApi()));
    await settle();
    expect(result.current.needsUsername).toBe(true);
  });

  it("does not ask while still loading", () => {
    const { result } = renderHook(() => useProfile("u1", fakeApi({ getMe: () => new Promise(() => {}) })));
    expect(result.current.needsUsername).toBe(false);
  });

  it("never blocks play when the profile can't be loaded", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const api = fakeApi({ getMe: vi.fn().mockRejectedValue(new Error("down")) });
    const { result } = renderHook(() => useProfile("u1", api));
    await settle();
    expect(result.current.status).toBe("error");
    expect(result.current.needsUsername).toBe(false);
    spy.mockRestore();
  });

  it("clears the profile on sign-out", async () => {
    const api = fakeApi({ getMe: vi.fn().mockResolvedValue(profile("Ann_T")) });
    const { result, rerender } = renderHook(({ id }) => useProfile(id, api), {
      initialProps: { id: "u1" as string | null },
    });
    await settle();
    rerender({ id: null });
    await settle();
    expect(result.current.username).toBeNull();
    expect(result.current.status).toBe("idle");
  });

  it("ignores a slow response for a user who has since signed out or switched", async () => {
    const slow = deferred<UserProfile>();
    const getMe = vi
      .fn()
      .mockReturnValueOnce(slow.promise)
      .mockResolvedValueOnce(profile("Bob_B", "u2"));
    const api = fakeApi({ getMe });
    const { result, rerender } = renderHook(({ id }) => useProfile(id, api), {
      initialProps: { id: "u1" as string | null },
    });

    rerender({ id: "u2" });
    await settle();
    await act(async () => slow.resolve(profile("Ann_T", "u1"))); // arrives last

    expect(result.current.username).toBe("Bob_B");
  });
});

describe("useProfile: saveUsername", () => {
  it("rejects invalid names locally without calling the server", async () => {
    const api = fakeApi();
    const { result } = renderHook(() => useProfile("u1", api));
    await settle();
    let outcome;
    await act(async () => {
      outcome = await result.current.saveUsername("a@b.com");
    });
    expect(outcome).toEqual({ ok: false, error: "Use only letters, numbers, underscores and hyphens." });
    expect(api.setUsername).not.toHaveBeenCalled();
  });

  it("sends the trimmed name, then exposes it", async () => {
    const api = fakeApi();
    const { result } = renderHook(() => useProfile("u1", api));
    await settle();
    let outcome;
    await act(async () => {
      outcome = await result.current.saveUsername("  Ann_T ");
    });
    expect(outcome).toEqual({ ok: true });
    expect(api.setUsername).toHaveBeenCalledWith("Ann_T");
    expect(result.current.username).toBe("Ann_T");
    expect(result.current.needsUsername).toBe(false);
  });

  it("returns the server's message for 409 and 400", async () => {
    const setUsername = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(409, "Conflict", "/me/username", "That username is taken."))
      .mockRejectedValueOnce(new ApiError(400, "Bad Request", "/me/username", "Username is required."));
    const { result } = renderHook(() => useProfile("u1", fakeApi({ setUsername })));
    await settle();
    let a, b;
    await act(async () => {
      a = await result.current.saveUsername("Ann_T");
      b = await result.current.saveUsername("Ann_T");
    });
    expect(a).toEqual({ ok: false, error: "That username is taken." });
    expect(b).toEqual({ ok: false, error: "Username is required." });
    expect(result.current.username).toBeNull();
  });

  it("falls back to a default message when the server gave none", async () => {
    const setUsername = vi.fn().mockRejectedValue(new ApiError(409, "Conflict", "/me/username"));
    const { result } = renderHook(() => useProfile("u1", fakeApi({ setUsername })));
    await settle();
    let outcome;
    await act(async () => {
      outcome = await result.current.saveUsername("Ann_T");
    });
    expect(outcome).toEqual({ ok: false, error: "That username is taken." });
  });

  it("shows a generic message for unexpected failures, never the raw error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const setUsername = vi.fn().mockRejectedValue(new Error("ECONNRESET at 10.0.0.5"));
    const { result } = renderHook(() => useProfile("u1", fakeApi({ setUsername })));
    await settle();
    let outcome;
    await act(async () => {
      outcome = await result.current.saveUsername("Ann_T");
    });
    expect(outcome).toEqual({ ok: false, error: "Couldn't save your username. Please try again." });
    spy.mockRestore();
  });

  it("keeps a stable saveUsername identity across renders", async () => {
    const { result, rerender } = renderHook(() => useProfile("u1", fakeApi()));
    await settle();
    const first = result.current.saveUsername;
    rerender();
    expect(result.current.saveUsername).toBe(first);
  });
});
