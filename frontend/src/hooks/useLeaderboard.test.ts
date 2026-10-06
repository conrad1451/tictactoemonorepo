// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { LeaderboardEntry } from "../types";
import { useLeaderboard } from "./useLeaderboard";

const entry = (username: string, bestTime = 4): LeaderboardEntry => ({
  userId: username,
  username,
  bestTime,
  totalGames: 3,
});

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useLeaderboard", () => {
  it("starts loading, then exposes the entries", async () => {
    const d = deferred<LeaderboardEntry[]>();
    const fetcher = vi.fn(() => d.promise);
    const { result } = renderHook(() => useLeaderboard(3, fetcher));

    expect(result.current.status).toBe("loading");
    expect(result.current.entries).toEqual([]);

    await act(async () => d.resolve([entry("ann")]));
    expect(result.current.status).toBe("success");
    expect(result.current.entries).toEqual([entry("ann")]);
  });

  it("fetches for the requested board size", async () => {
    const fetcher = vi.fn().mockResolvedValue([]);
    renderHook(() => useLeaderboard(5, fetcher));
    await act(async () => {}); // let the response settle inside act
    expect(fetcher).toHaveBeenCalledWith(5);
  });

  it("reports an error and logs it when the request fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const d = deferred<LeaderboardEntry[]>();
    const { result } = renderHook(() => useLeaderboard(3, () => d.promise));

    await act(async () => d.reject(new Error("boom")));
    expect(result.current.status).toBe("error");
    expect(result.current.entries).toEqual([]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("clears old entries and reloads when the board size changes", async () => {
    const first = deferred<LeaderboardEntry[]>();
    const second = deferred<LeaderboardEntry[]>();
    const fetcher = vi.fn((size: number) => (size === 3 ? first.promise : second.promise));
    const { result, rerender } = renderHook(({ size }) => useLeaderboard(size, fetcher), {
      initialProps: { size: 3 },
    });

    await act(async () => first.resolve([entry("three")]));
    expect(result.current.entries).toEqual([entry("three")]);

    rerender({ size: 5 });
    expect(result.current.status).toBe("loading");
    expect(result.current.entries).toEqual([]);

    await act(async () => second.resolve([entry("five")]));
    expect(result.current.entries).toEqual([entry("five")]);
  });

  it("ignores a late response for a size the user already left (race)", async () => {
    const slow3 = deferred<LeaderboardEntry[]>();
    const fast5 = deferred<LeaderboardEntry[]>();
    const fetcher = vi.fn((size: number) => (size === 3 ? slow3.promise : fast5.promise));
    const { result, rerender } = renderHook(({ size }) => useLeaderboard(size, fetcher), {
      initialProps: { size: 3 },
    });

    rerender({ size: 5 });
    await act(async () => fast5.resolve([entry("five")]));
    await act(async () => slow3.resolve([entry("three")])); // arrives last

    expect(result.current.entries).toEqual([entry("five")]);
  });

  it("ignores a late failure for a size the user already left", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const slow3 = deferred<LeaderboardEntry[]>();
    const fetcher = vi.fn((size: number) => (size === 3 ? slow3.promise : Promise.resolve([entry("five")])));
    const { result, rerender } = renderHook(({ size }) => useLeaderboard(size, fetcher), {
      initialProps: { size: 3 },
    });

    rerender({ size: 5 });
    await act(async () => {});
    await act(async () => slow3.reject(new Error("late")));

    expect(result.current.status).toBe("success");
    spy.mockRestore();
  });

  it("does not refetch just because the fetcher identity changed", async () => {
    const a = vi.fn().mockResolvedValue([]);
    const b = vi.fn().mockResolvedValue([]);
    const { rerender } = renderHook(({ fn }) => useLeaderboard(3, fn), { initialProps: { fn: a } });
    rerender({ fn: b });
    await act(async () => {});
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
  });
});
