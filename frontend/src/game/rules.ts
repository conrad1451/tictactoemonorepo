// frontend/src/game/rules.ts
// CHQ: Claude AI (Sonnet) generated file
// Pure game rules: no React, no timers, no randomness.

export type BoardCell = "X" | "O" | null;
export type Winner = "X" | "O" | "draw" | null;

export interface WinResult {
  winner: Winner;
  line: number[] | null;
}

export const createEmptyBoard = (boardSize: number): BoardCell[] =>
  Array<BoardCell>(boardSize * boardSize).fill(null);

const linesCache = new Map<number, number[][]>();

/**
 * Every winning line for an n x n board (n rows, n columns, 2 diagonals).
 * A line always needs `boardSize` marks in a row, matching the original behavior.
 */
export const getWinningLines = (boardSize: number): number[][] => {
  const cached = linesCache.get(boardSize);
  if (cached) return cached;

  const range = Array.from({ length: boardSize }, (_, i) => i);
  const lines: number[][] = [
    ...range.map((r) => range.map((c) => r * boardSize + c)), // rows
    ...range.map((c) => range.map((r) => r * boardSize + c)), // columns
    range.map((i) => i * boardSize + i), // main diagonal
    range.map((i) => i * boardSize + (boardSize - 1 - i)), // anti diagonal
  ];

  linesCache.set(boardSize, lines);
  return lines;
};

export const getAvailableMoves = (board: BoardCell[]): number[] =>
  board.reduce<number[]>((acc, cell, idx) => {
    if (cell === null) acc.push(idx);
    return acc;
  }, []);

export const checkWinner = (board: BoardCell[], boardSize: number): WinResult => {
  for (const line of getWinningLines(boardSize)) {
    const first = board[line[0]];
    if (first && line.every((idx) => board[idx] === first)) {
      return { winner: first, line };
    }
  }

  if (board.every((cell) => cell !== null)) {
    return { winner: "draw", line: null };
  }

  return { winner: null, line: null };
};

/** Board sizes offered in the UI (mode selection and leaderboard tabs). */
export const BOARD_SIZES = [3, 4, 5, 6, 7] as const;