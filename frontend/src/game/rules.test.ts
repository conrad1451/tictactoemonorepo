import { describe, it, expect } from "vitest";
import {
  BoardCell,
  checkWinner,
  createEmptyBoard,
  getAvailableMoves,
  getWinningLines,
} from "./rules";

// CHQ: Claude AI (Sonnet) generated file

const SIZES = [3, 4, 5, 6, 7];

describe("createEmptyBoard", () => {
  it.each(SIZES)("creates %i x %i empty board", (n) => {
    const board = createEmptyBoard(n);
    expect(board).toHaveLength(n * n);
    expect(board.every((c) => c === null)).toBe(true);
  });
});

describe("getWinningLines", () => {
  it.each(SIZES)("has 2n+2 lines of length n for size %i", (n) => {
    const lines = getWinningLines(n);
    expect(lines).toHaveLength(2 * n + 2);
    expect(lines.every((l) => l.length === n)).toBe(true);
  });

  it("returns the expected 3x3 lines", () => {
    const lines = getWinningLines(3);
    expect(lines).toContainEqual([0, 1, 2]); // row
    expect(lines).toContainEqual([1, 4, 7]); // column
    expect(lines).toContainEqual([0, 4, 8]); // main diagonal
    expect(lines).toContainEqual([2, 4, 6]); // anti diagonal
  });
});

describe("getAvailableMoves", () => {
  it("returns indices of empty cells only", () => {
    const board: BoardCell[] = ["X", null, "O", null];
    expect(getAvailableMoves(board)).toEqual([1, 3]);
  });

  it("returns [] for a full board", () => {
    expect(getAvailableMoves(["X", "O", "X"])).toEqual([]);
  });
});

describe("checkWinner", () => {
  describe.each(SIZES)("%i x %i board", (n) => {
    const lines = getWinningLines(n);

    it.each(["X", "O"] as const)("detects every line for %s", (player) => {
      for (const line of lines) {
        const board = createEmptyBoard(n);
        line.forEach((i) => (board[i] = player));
        expect(checkWinner(board, n)).toEqual({ winner: player, line });
      }
    });

    it("reports no winner on an empty board", () => {
      expect(checkWinner(createEmptyBoard(n), n)).toEqual({ winner: null, line: null });
    });

    it("does not report a win for an incomplete line", () => {
      const board = createEmptyBoard(n);
      lines[0].slice(0, -1).forEach((i) => (board[i] = "X"));
      expect(checkWinner(board, n).winner).toBeNull();
    });
  });

  it("detects a draw on a full 3x3 board with no line", () => {
    const board: BoardCell[] = ["X", "O", "X", "X", "O", "O", "O", "X", "X"];
    expect(checkWinner(board, 3)).toEqual({ winner: "draw", line: null });
  });

  it("prefers a win over a draw when the last move fills the board", () => {
    const board: BoardCell[] = ["X", "O", "X", "O", "X", "O", "O", "X", "X"];
    expect(checkWinner(board, 3).winner).toBe("X");
  });

  it("does not mix X and O in one line", () => {
    const board: BoardCell[] = ["X", "X", "O", null, null, null, null, null, null];
    expect(checkWinner(board, 3).winner).toBeNull();
  });
});
