// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthUser } from "../types";
import { AuthStore, useAuth } from "./useAuth";

const user: AuthUser = { userId: "u1", email: "a@b.c", name: "Ann", sessionJwt: "jwt" };

const fakeStore = (initial: AuthUser | null = null, canSave = true) => {
  const store: AuthStore = {
    getAuthUser: vi.fn(() => initial),
    saveAuthUser: vi.fn(() => canSave),
    clearAuth: vi.fn(),
  };
  return store;
};

describe("useAuth", () => {
  it("starts signed out when nothing is stored", () => {
    const { result } = renderHook(() => useAuth(fakeStore()));
    expect(result.current.authUser).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("restores a stored session on the very first render", () => {
    const { result } = renderHook(() => useAuth(fakeStore(user)));
    expect(result.current.authUser).toEqual(user);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("reads storage once, not on every render", () => {
    const store = fakeStore();
    const { rerender } = renderHook(() => useAuth(store));
    rerender();
    rerender();
    expect(store.getAuthUser).toHaveBeenCalledTimes(1);
  });

  it("login persists the user and updates state", () => {
    const store = fakeStore();
    const { result } = renderHook(() => useAuth(store));
    let ok = false;
    act(() => {
      ok = result.current.login(user);
    });
    expect(ok).toBe(true);
    expect(store.saveAuthUser).toHaveBeenCalledWith(user);
    expect(result.current.authUser).toEqual(user);
  });

  it("login reports failure and stays signed out when storage can't save", () => {
    const { result } = renderHook(() => useAuth(fakeStore(null, false)));
    let ok = true;
    act(() => {
      ok = result.current.login(user);
    });
    expect(ok).toBe(false);
    expect(result.current.authUser).toBeNull();
  });

  it("logout clears storage and state", () => {
    const store = fakeStore(user);
    const { result } = renderHook(() => useAuth(store));
    act(() => result.current.logout());
    expect(store.clearAuth).toHaveBeenCalledTimes(1);
    expect(result.current.authUser).toBeNull();
  });

  it("login and logout keep a stable identity across renders", () => {
    const { result, rerender } = renderHook(() => useAuth(fakeStore()));
    const { login, logout } = result.current;
    rerender();
    expect(result.current.login).toBe(login);
    expect(result.current.logout).toBe(logout);
  });
});
