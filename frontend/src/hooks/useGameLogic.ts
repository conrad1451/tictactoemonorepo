// frontend/src/hooks/useGameLogic.ts

// CHQ: Created with Claude AI (Haiku) and modified with Gemini AI

import { useState, useCallback, useEffect, useRef } from "react";
import { saveScore } from "../services/api";

export type BoardCell = "X" | "O" | null;

export const useGameLogic = (boardSize: number, _onBackToHome: () => void) => {
  const totalCells = boardSize * boardSize;
  const [board, setBoard] = useState<BoardCell[]>(() => Array(totalCells).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<"X" | "O" | "draw" | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [timeSeconds, setTimeSeconds] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setBoard(Array(boardSize * boardSize).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    setTimeSeconds(0);
  }, [boardSize]);

  useEffect(() => {
    if (!winner) {
      timerRef.current = setInterval(() => {
        setTimeSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [winner]);

  const checkWinner = useCallback(
    (currentBoard: BoardCell[]): { winner: "X" | "O" | "draw" | null; line: number[] | null } => {
      // 1. Check Rows
      for (let r = 0; r < boardSize; r++) {
        const rowIndices: number[] = [];
        for (let c = 0; c < boardSize; c++) {
          rowIndices.push(r * boardSize + c);
        }
        const first = currentBoard[rowIndices[0]];
        if (first && rowIndices.every((idx) => currentBoard[idx] === first)) {
          return { winner: first, line: rowIndices };
        }
      }

      // 2. Check Columns
      for (let c = 0; c < boardSize; c++) {
        const colIndices: number[] = [];
        for (let r = 0; r < boardSize; r++) {
          colIndices.push(r * boardSize + c);
        }
        const first = currentBoard[colIndices[0]];
        if (first && colIndices.every((idx) => currentBoard[idx] === first)) {
          return { winner: first, line: colIndices };
        }
      }

      // 3. Check Main Diagonal
      const mainDiagIndices: number[] = [];
      for (let i = 0; i < boardSize; i++) {
        mainDiagIndices.push(i * boardSize + i);
      }
      const mainFirst = currentBoard[mainDiagIndices[0]];
      if (mainFirst && mainDiagIndices.every((idx) => currentBoard[idx] === mainFirst)) {
        return { winner: mainFirst, line: mainDiagIndices };
      }

      // 4. Check Anti Diagonal
      const antiDiagIndices: number[] = [];
      for (let i = 0; i < boardSize; i++) {
        antiDiagIndices.push(i * boardSize + (boardSize - 1 - i));
      }
      const antiFirst = currentBoard[antiDiagIndices[0]];
      if (antiFirst && antiDiagIndices.every((idx) => currentBoard[idx] === antiFirst)) {
        return { winner: antiFirst, line: antiDiagIndices };
      }

      // 5. Check Draw
      if (currentBoard.every((cell) => cell !== null)) {
        return { winner: "draw", line: null };
      }

      return { winner: null, line: null };
    },
    [boardSize]
  );

  const getComputerMove = useCallback(
    (currentBoard: BoardCell[]): number => {
      const availableIndices = currentBoard
        .map((val, idx) => (val === null ? idx : null))
        .filter((val): val is number => val !== null);

      if (availableIndices.length === 0) return -1;

      // Try to win
      for (const idx of availableIndices) {
        const testBoard = [...currentBoard];
        testBoard[idx] = "O";
        if (checkWinner(testBoard).winner === "O") return idx;
      }

      // Try to block player win
      for (const idx of availableIndices) {
        const testBoard = [...currentBoard];
        testBoard[idx] = "X";
        if (checkWinner(testBoard).winner === "X") return idx;
      }

      // Take center if available
      const centerIndex = Math.floor(totalCells / 2);
      if (availableIndices.includes(centerIndex)) return centerIndex;

      // Choose random open cell
      return availableIndices[Math.floor(Math.random() * availableIndices.length)];
    },
    [totalCells, checkWinner]
  );

  const handleGameEnd = async (gameWinner: "X" | "O" | "draw", line: number[] | null) => {
    setWinner(gameWinner);
    setWinningLine(line);
    setIsSubmitting(true);

    try {
      const gameOutcome =
        gameWinner === "draw" ? "draw" : gameWinner === "X" ? "win" : "loss";
      await saveScore(gameOutcome, timeSeconds, boardSize);
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
        const computerIndex = getComputerMove(board);
        if (computerIndex !== -1) {
          const newBoard = [...board];
          newBoard[computerIndex] = "O";
          setBoard(newBoard);

          const result = checkWinner(newBoard);
          if (result.winner) {
            handleGameEnd(result.winner, result.line);
          } else {
            setIsXNext(true);
          }
        }
      }, 400); // Small pause for realistic feel

      return () => clearTimeout(timer);
    }
  }, [isXNext, winner, isSubmitting, board, getComputerMove, checkWinner]);

  const handleCellClick = async (index: number) => {
    if (board[index] || winner || isSubmitting || !isXNext) return;

    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);

    const result = checkWinner(newBoard);

    if (result.winner) {
      await handleGameEnd(result.winner, result.line);
    } else {
      setIsXNext(false); // Triggers computer move effect
    }
  };

  const resetGame = () => {
    setBoard(Array(boardSize * boardSize).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    setTimeSeconds(0);
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