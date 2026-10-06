// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameLogic, GameLogicOptions } from "./useGameLogic";

const DELAY = 10;

const scriptedComputer = (...moves: number[]) => {
  const queue = [...moves];
  return vi.fn(() => queue.shift() ?? -1);
};

const setup = (overrides: Partial<GameLogicOptions> = {}, boardSize = 3) => {
  const saveScore = vi.fn().mockResolvedValue({});
  const options: Partial<GameLogicOptions> = {
    saveScore,
    getAuthToken: () => "token",
    chooseComputerMove: scriptedComputer(3, 4),
    computerDelayMs: DELAY,
    ...overrides,
  };
  const hook = renderHook(({ size }) => useGameLogic(size, options), {
    initialProps: { size: boardSize },
  });
  return { ...hook, saveScore };
};

const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
const click = (result: { current: ReturnType<typeof useGameLogic> }, i: number) =>
  act(() => result.current.handleCellClick(i));

/** X wins the top row; O plays 3 and 4. Spends `thinkMs` extra before the winning click. */
const playWinningGame = async (result: { current: ReturnType<typeof useGameLogic> }, thinkMs = 0) => {
  await click(result, 0);
  await advance(DELAY);
  await click(result, 1);
  await advance(DELAY);
  await advance(thinkMs);
  await click(result, 2);
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useGameLogic", () => {
  it("starts empty with X to move", () => {
    const { result } = setup();
    expect(result.current.board).toEqual(Array(9).fill(null));
    expect(result.current.isXNext).toBe(true);
    expect(result.current.winner).toBeNull();
  });

  it("plays the computer's move after the delay", async () => {
    const { result } = setup();
    await click(result, 0);
    expect(result.current.isXNext).toBe(false);
    await advance(DELAY);
    expect(result.current.board[3]).toBe("O");
    expect(result.current.isXNext).toBe(true);
  });

  it("ignores clicks on occupied cells", async () => {
    const { result } = setup();
    await click(result, 0);
    await advance(DELAY);
    await click(result, 0);
    expect(result.current.board[0]).toBe("X");
    expect(result.current.isXNext).toBe(true);
  });

  it("increments the timer once per second", async () => {
    const { result } = setup();
    await advance(3000);
    expect(result.current.timeSeconds).toBe(3);
  });

  describe("when the player wins", () => {
    it("sets the winner and winning line", async () => {
      const { result } = setup();
      await playWinningGame(result);
      expect(result.current.winner).toBe("X");
      expect(result.current.winningLine).toEqual([0, 1, 2]);
    });

    it("saves the FINAL time exactly once (regression: stale timeSeconds)", async () => {
      const { result, saveScore } = setup();
      await playWinningGame(result, 5000);
      expect(result.current.timeSeconds).toBe(5);
      expect(saveScore).toHaveBeenCalledTimes(1);
      expect(saveScore).toHaveBeenCalledWith("win", 5, 3);
    });

    it("stops the timer", async () => {
      const { result } = setup();
      await playWinningGame(result, 2000);
      const frozen = result.current.timeSeconds;
      await advance(5000);
      expect(result.current.timeSeconds).toBe(frozen);
    });

    it("skips saving for guests", async () => {
      const { result, saveScore } = setup({ getAuthToken: () => null });
      await playWinningGame(result);
      expect(result.current.winner).toBe("X");
      expect(saveScore).not.toHaveBeenCalled();
    });

    it("disables input while the save is in flight, then re-enables", async () => {
      let resolve!: () => void;
      const pending = new Promise<void>((r) => (resolve = r));
      const { result } = setup({ saveScore: vi.fn(() => pending) });
      await playWinningGame(result);
      expect(result.current.isSubmitting).toBe(true);
      await act(async () => resolve());
      expect(result.current.isSubmitting).toBe(false);
    });

    it("survives a failed save", async () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { result } = setup({ saveScore: vi.fn().mockRejectedValue(new Error("boom")) });
      await playWinningGame(result);
      expect(result.current.winner).toBe("X");
      expect(result.current.isSubmitting).toBe(false);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  it("saves a loss when the computer wins", async () => {
    const { result, saveScore } = setup({ chooseComputerMove: scriptedComputer(3, 4, 5) });
    await click(result, 0); await advance(DELAY);
    await click(result, 1); await advance(DELAY);
    await click(result, 8); await advance(DELAY);
    expect(result.current.winner).toBe("O");
    expect(saveScore).toHaveBeenCalledWith("loss", 0, 3);
  });

  it("resetGame clears the board, winner and timer, and the timer restarts", async () => {
    const { result } = setup();
    await playWinningGame(result, 2000);
    await act(async () => result.current.resetGame());
    expect(result.current.board).toEqual(Array(9).fill(null));
    expect(result.current.winner).toBeNull();
    expect(result.current.timeSeconds).toBe(0);
    await advance(2000);
    expect(result.current.timeSeconds).toBe(2);
  });

  it("starts a new game when boardSize changes", async () => {
    const { result, rerender } = setup();
    await click(result, 0);
    rerender({ size: 5 });
    expect(result.current.board).toHaveLength(25);
    expect(result.current.board.every((c) => c === null)).toBe(true);
    expect(result.current.isXNext).toBe(true);
  });
});