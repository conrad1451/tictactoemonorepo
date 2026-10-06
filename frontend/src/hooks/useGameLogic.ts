// frontend/src/hooks/useGameLogic.ts

import { useEffect, useReducer, useRef, useState } from "react";
import { saveScore, getAuthToken } from "../services/api";
import { BoardCell } from "../game/rules";
import { getComputerMove } from "../game/computerPlayer";
import { createInitialState, gameReducer } from "../game/gameReducer";
import { useTimer } from "./useTimer";

export type { BoardCell } from "../game/rules";

// 1 = unbeatable, 0 = fully random.
const SMART_MOVE_CHANCE = 0.5;

export interface GameLogicOptions {
  saveScore: (result: "win" | "loss" | "draw", timeSeconds: number, boardSize: number) => Promise<unknown>;
  getAuthToken: () => string | null;
  /** Returns the cell index for the computer, or -1 if none. */
  chooseComputerMove: (board: BoardCell[], boardSize: number) => number;
  computerDelayMs: number;
}

const defaultOptions: GameLogicOptions = {
  saveScore,
  getAuthToken,
  chooseComputerMove: (board, boardSize) =>
    getComputerMove(board, boardSize, { smartMoveChance: SMART_MOVE_CHANCE }),
  computerDelayMs: 400,
};

export const useGameLogic = (boardSize: number, overrides: Partial<GameLogicOptions> = {}) => {
  const options = { ...defaultOptions, ...overrides };
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [state, dispatch] = useReducer(gameReducer, boardSize, createInitialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Start a fresh game when the board size changes (skip the initial mount).
  const lastSize = useRef(boardSize);
  useEffect(() => {
    if (lastSize.current !== boardSize) {
      lastSize.current = boardSize;
      dispatch({ type: "RESET", boardSize });
    }
  }, [boardSize]);

  useTimer(!state.winner, () => dispatch({ type: "TICK" }));

  // Computer's turn.
  useEffect(() => {
    if (state.isXNext || state.winner) return;
    const timer = setTimeout(() => {
      const index = optionsRef.current.chooseComputerMove(state.board, state.boardSize);
      if (index !== -1) dispatch({ type: "COMPUTER_MOVE", index });
    }, optionsRef.current.computerDelayMs);
    return () => clearTimeout(timer);
  }, [state.isXNext, state.winner, state.board, state.boardSize]);

  // Save the result once, when the game ends. The timer stops at that moment,
  // so state.timeSeconds is the final time (no stale closure).
  useEffect(() => {
    if (!state.winner) return;
    const { saveScore, getAuthToken } = optionsRef.current;
    if (!getAuthToken()) return; // guest: nothing to save

    const outcome = state.winner === "draw" ? "draw" : state.winner === "X" ? "win" : "loss";
    setIsSubmitting(true);
    saveScore(outcome, state.timeSeconds, state.boardSize)
      .catch((err) => console.error("Failed to auto-save match result:", err))
      .finally(() => setIsSubmitting(false));
    // Intentionally keyed on winner only: run once per finished game.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.winner]);

  const handleCellClick = (index: number) => {
    if (isSubmitting) return;
    dispatch({ type: "PLAYER_MOVE", index });
  };

  const resetGame = () => dispatch({ type: "RESET", boardSize });

  return {
    board: state.board,
    isXNext: state.isXNext,
    winner: state.winner,
    winningLine: state.winningLine,
    timeSeconds: state.timeSeconds,
    isSubmitting,
    handleCellClick,
    resetGame,
  };
};