// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTimer } from "./useTimer";

// CHQ: Claude AI (Sonnet) generated file

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useTimer", () => {
  it("ticks every interval while running", () => {
    const onTick = vi.fn();
    renderHook(() => useTimer(true, onTick, 1000));
    vi.advanceTimersByTime(3500);
    expect(onTick).toHaveBeenCalledTimes(3);
  });

  it("does not tick when not running", () => {
    const onTick = vi.fn();
    renderHook(() => useTimer(false, onTick));
    vi.advanceTimersByTime(5000);
    expect(onTick).not.toHaveBeenCalled();
  });

  it("stops when isRunning becomes false and resumes when true", () => {
    const onTick = vi.fn();
    const { rerender } = renderHook(({ run }) => useTimer(run, onTick), { initialProps: { run: true } });
    vi.advanceTimersByTime(2000);
    rerender({ run: false });
    vi.advanceTimersByTime(5000);
    expect(onTick).toHaveBeenCalledTimes(2);
    rerender({ run: true });
    vi.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenCalledTimes(3);
  });

  it("always calls the latest callback without restarting the interval", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ cb }) => useTimer(true, cb), { initialProps: { cb: first } });
    vi.advanceTimersByTime(500);
    rerender({ cb: second });
    vi.advanceTimersByTime(500);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("clears the interval on unmount", () => {
    const onTick = vi.fn();
    const { unmount } = renderHook(() => useTimer(true, onTick));
    unmount();
    vi.advanceTimersByTime(5000);
    expect(onTick).not.toHaveBeenCalled();
  });
});