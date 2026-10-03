import { describe, it, expect } from "vitest";
import { findWinningMove, getComputerMove } from "./computerPlayer";
import { BoardCell, createEmptyBoard } from "./rules";

// CHQ: Claude AI (Sonnet) generated file

const constant = (v: number) => () => v;
const sequence = (...values: number[]) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
};

// O can win at 2, X can win at 5
const winAndBlock = (): BoardCell[] => ["O", "O", null, "X", "X", null, null, null, null];

describe("findWinningMove", () => {
  it("finds the winning cell for a player", () => {
    expect(findWinningMove(winAndBlock(), 3, "O")).toBe(2);
    expect(findWinningMove(winAndBlock(), 3, "X")).toBe(5);
  });

  it("returns -1 when no winning move exists", () => {
    expect(findWinningMove(createEmptyBoard(3), 3, "O")).toBe(-1);
  });

  it("does not mutate the board", () => {
    const board = winAndBlock();
    const copy = [...board];
    findWinningMove(board, 3, "O");
    expect(board).toEqual(copy);
  });
});

describe("getComputerMove (smart path, smartMoveChance = 1)", () => {
  const opts = { smartMoveChance: 1, random: constant(0) };

  it("takes a winning move over blocking", () => {
    expect(getComputerMove(winAndBlock(), 3, opts)).toBe(2);
  });

  it("blocks the player's winning move", () => {
    const board: BoardCell[] = ["X", "X", null, null, "O", null, null, null, null];
    expect(getComputerMove(board, 3, opts)).toBe(2);
  });

  it("takes the center when there is no win or block", () => {
    const board: BoardCell[] = ["X", null, null, null, null, null, null, null, null];
    expect(getComputerMove(board, 3, opts)).toBe(4);
  });

  it("finds wins on larger boards", () => {
    const board = createEmptyBoard(5);
    [0, 1, 2, 3].forEach((i) => (board[i] = "O"));
    expect(getComputerMove(board, 5, opts)).toBe(4);
  });
});

describe("getComputerMove (random path)", () => {
  it("ignores wins when smartMoveChance = 0", () => {
    // available = [2,5,6,7,8]; random 0.99 -> index 4 -> cell 8
    expect(getComputerMove(winAndBlock(), 3, { smartMoveChance: 0, random: constant(0.99) })).toBe(8);
  });

  it("only picks from open cells", () => {
    const board: BoardCell[] = ["X", "O", "X", "O", "X", "O", "O", null, "X"];
    for (const r of [0, 0.3, 0.99]) {
      expect(getComputerMove(board, 3, { smartMoveChance: 0, random: constant(r) })).toBe(7);
    }
  });

  it("does not take the center on the random path", () => {
    const board = createEmptyBoard(3);
    expect(getComputerMove(board, 3, { smartMoveChance: 0, random: constant(0) })).toBe(0);
  });
});

describe("getComputerMove (smart roll)", () => {
  it("plays smart when roll < smartMoveChance", () => {
    const random = sequence(0.4);
    expect(getComputerMove(winAndBlock(), 3, { smartMoveChance: 0.5, random })).toBe(2);
  });

  it("plays randomly when roll >= smartMoveChance", () => {
    const random = sequence(0.6, 0.99);
    expect(getComputerMove(winAndBlock(), 3, { smartMoveChance: 0.5, random })).toBe(8);
  });
});

describe("getComputerMove (edge cases)", () => {
  it("returns -1 on a full board", () => {
    const board: BoardCell[] = ["X", "O", "X", "O", "X", "O", "O", "X", "O"];
    expect(getComputerMove(board, 3, { smartMoveChance: 1 })).toBe(-1);
  });
});
