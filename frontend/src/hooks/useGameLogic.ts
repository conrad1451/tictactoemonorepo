// frontend/src/hooks/useGameLogic.ts

// CHQ: Created with Claude AI (Haiku) and modified 
//      with Gemini AI and Claude AI (Sonent)

import { useState, useEffect, useRef } from "react";
import { saveScore, getAuthToken } from "../services/api";
import { BoardCell, Winner, checkWinner, createEmptyBoard } from "../game/rules";
import { getComputerMove } from "../game/computerPlayer";

export type { BoardCell } from "../game/rules";

// 1 = unbeatable, 0 = fully random.
const SMART_MOVE_CHANCE = 0.5;

export const useGameLogic = (boardSize: number, _onBackToHome: () => void) => {
  const [board, setBoard] = useState<BoardCell[]>(() => createEmptyBoard(boardSize));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<Winner>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [timeSeconds, setTimeSeconds] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetGame = () => {
    setBoard(createEmptyBoard(boardSize));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    setTimeSeconds(0);
  };

  useEffect(resetGame, [boardSize]);

  useEffect(() => {
    if (!winner) {
      timerRef.current = setInterval(() => setTimeSeconds((prev) => prev + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [winner]);

  const handleGameEnd = async (gameWinner: Exclude<Winner, null>, line: number[] | null) => {
    setWinner(gameWinner);
    setWinningLine(line);

    if (!getAuthToken()) {
      console.log("Guest session detected: Score saving skipped.");
      return;
    }

    setIsSubmitting(true);
    try {
      const outcome = gameWinner === "draw" ? "draw" : gameWinner === "X" ? "win" : "loss";
      await saveScore(outcome, timeSeconds, boardSize);
    } catch (err) {
      console.error("Failed to auto-save match result:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Computer move turn listener
  useEffect(() => {
    if (!isXNext && !winner && !isSubmitting) {
      const timer = setTimeout(() => {
        const computerIndex = getComputerMove(board, boardSize, {
          smartMoveChance: SMART_MOVE_CHANCE,
        });
        if (computerIndex !== -1) {
          const newBoard = [...board];
          newBoard[computerIndex] = "O";
          setBoard(newBoard);

          const result = checkWinner(newBoard, boardSize);
          if (result.winner) {
            handleGameEnd(result.winner, result.line);
          } else {
            setIsXNext(true);
          }
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [isXNext, winner, isSubmitting, board, boardSize]);

  const handleCellClick = async (index: number) => {
    if (board[index] || winner || isSubmitting || !isXNext) return;

    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);

    const result = checkWinner(newBoard, boardSize);
    if (result.winner) {
      await handleGameEnd(result.winner, result.line);
    } else {
      setIsXNext(false);
    }
  };

  return {
    board,
    isXNext,
    winner,
    winningLine,
    timeSeconds,
    isSubmitting,
    handleCellClick,
    resetGame,
  };
};