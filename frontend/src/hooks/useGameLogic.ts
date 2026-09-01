import { useState, useCallback, useEffect, useRef } from "react";
import { saveScore } from "../services/api";

export type BoardCell = "X" | "O" | null;

export const useGameLogic = (boardSize: number, onBackToHome: () => void) => {
  const totalCells = boardSize * boardSize;
  const [board, setBoard] = useState<BoardCell[]>(() => Array(totalCells).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<"X" | "O" | "draw" | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [timeSeconds, setTimeSeconds] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset state when board size changes
  useEffect(() => {
    setBoard(Array(boardSize * boardSize).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    setTimeSeconds(0);
  }, [boardSize]);

  // Timer effect
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

  // Check rows, columns, and diagonals for dynamic N size
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

      // 3. Check Main Diagonal (Top-Left to Bottom-Right)
      const mainDiagIndices: number[] = [];
      for (let i = 0; i < boardSize; i++) {
        mainDiagIndices.push(i * boardSize + i);
      }
      const mainFirst = currentBoard[mainDiagIndices[0]];
      if (mainFirst && mainDiagIndices.every((idx) => currentBoard[idx] === mainFirst)) {
        return { winner: mainFirst, line: mainDiagIndices };
      }

      // 4. Check Anti Diagonal (Top-Right to Bottom-Left)
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

  // Handle move click
  const handleCellClick = async (index: number) => {
    if (board[index] || winner || isSubmitting) return;

    const newBoard = [...board];
    const currentPlayer = isXNext ? "X" : "O";
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const result = checkWinner(newBoard);

    if (result.winner) {
      setWinner(result.winner);
      setWinningLine(result.line);
      setIsSubmitting(true);

      try {
        const gameOutcome =
          result.winner === "draw" ? "draw" : result.winner === "X" ? "win" : "loss";
        await saveScore(gameOutcome, timeSeconds, boardSize);
      } catch (err) {
        console.error("Failed to auto-save match result:", err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsXNext(!isXNext);
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