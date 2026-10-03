// frontend/src/game/gameReducer.ts
// All game state transitions as a pure function. No timers, no network, no randomness.

import { BoardCell, Winner, checkWinner, createEmptyBoard } from "./rules";

export interface GameState {
  board: BoardCell[];
  boardSize: number;
  isXNext: boolean;
  winner: Winner;
  winningLine: number[] | null;
  timeSeconds: number;
}

export type GameAction =
  | { type: "PLAYER_MOVE"; index: number }
  | { type: "COMPUTER_MOVE"; index: number }
  | { type: "TICK" }
  | { type: "RESET"; boardSize?: number };

export const createInitialState = (boardSize: number): GameState => ({
  board: createEmptyBoard(boardSize),
  boardSize,
  isXNext: true,
  winner: null,
  winningLine: null,
  timeSeconds: 0,
});

const applyMove = (state: GameState, index: number, mark: "X" | "O"): GameState => {
  const board = [...state.board];
  board[index] = mark;
  const result = checkWinner(board, state.boardSize);

  return {
    ...state,
    board,
    winner: result.winner,
    winningLine: result.line,
    isXNext: result.winner ? state.isXNext : mark === "O",
  };
};

const isPlayable = (state: GameState, index: number): boolean =>
  !state.winner &&
  Number.isInteger(index) &&
  index >= 0 &&
  index < state.board.length &&
  state.board[index] === null;

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "PLAYER_MOVE":
      if (!state.isXNext || !isPlayable(state, action.index)) return state;
      return applyMove(state, action.index, "X");

    case "COMPUTER_MOVE":
      if (state.isXNext || !isPlayable(state, action.index)) return state;
      return applyMove(state, action.index, "O");

    case "TICK":
      if (state.winner) return state;
      return { ...state, timeSeconds: state.timeSeconds + 1 };

    case "RESET":
      return createInitialState(action.boardSize ?? state.boardSize);
  }
};