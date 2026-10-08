// frontend/src/game/computerPlayer.ts

// CHQ: Claude AI (Sonnet) generated file
// Computer opponent. Randomness and difficulty are injected so tests are deterministic.

import {
  BoardCell,
  checkWinner,
  getAvailableMoves,
} from "./rules";

export interface ComputerMoveOptions {
  /** Chance (0..1) the computer plays "smart" (win / block / center) instead of randomly. */
  smartMoveChance: number;
  /** Returns a number in [0, 1). Defaults to Math.random. */
  random?: () => number;
}

/** First available cell that would give `player` a win, or -1. */
export const findWinningMove = (
  board: BoardCell[],
  boardSize: number,
  player: "X" | "O"
): number => {
  for (const idx of getAvailableMoves(board)) {
    const testBoard = [...board];
    testBoard[idx] = player;
    if (checkWinner(testBoard, boardSize).winner === player) return idx;
  }
  return -1;
};

/** Returns the chosen cell index, or -1 if the board is full. */
export const getComputerMove = (
  board: BoardCell[],
  boardSize: number,
  { smartMoveChance, random = Math.random }: ComputerMoveOptions
): number => {
  const available = getAvailableMoves(board);
  if (available.length === 0) return -1;

  const playSmart = random() < smartMoveChance;

  if (playSmart) {
    const win = findWinningMove(board, boardSize, "O");
    if (win !== -1) return win;

    const block = findWinningMove(board, boardSize, "X");
    if (block !== -1) return block;

    const center = Math.floor(board.length / 2);
    if (available.includes(center)) return center;
  }

  return available[Math.floor(random() * available.length)];
};