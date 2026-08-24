import { useState, useCallback, useEffect } from "react";
import { GameState, CellValue, Board } from "../types";

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    isXNext: true,
    winner: null,
    moveCount: 0,
  });

  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer effect
  useEffect(() => {
    if (startTime && !gameState.winner) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [startTime, gameState.winner]);

  const calculateWinner = (squares: Board): CellValue | "Draw" | null => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (
        squares[a] &&
        squares[a] === squares[b] &&
        squares[a] === squares[c]
      ) {
        return squares[a];
      }
    }

    // Check for draw
    if (squares.every((square) => square !== null)) {
      return "Draw";
    }

    return null;
  };

  const getComputerMove = (squares: Board): number => {
    // Winning move
    for (let i = 0; i < 9; i++) {
      if (squares[i] === null) {
        const testBoard = [...squares];
        testBoard[i] = "O";
        if (calculateWinner(testBoard) === "O") {
          return i;
        }
      }
    }

    // Block player winning move
    for (let i = 0; i < 9; i++) {
      if (squares[i] === null) {
        const testBoard = [...squares];
        testBoard[i] = "X";
        if (calculateWinner(testBoard) === "X") {
          return i;
        }
      }
    }

    // Take center
    if (squares[4] === null) {
      return 4;
    }

    // Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter((i) => squares[i] === null);
    if (availableCorners.length > 0) {
      return availableCorners[
        Math.floor(Math.random() * availableCorners.length)
      ];
    }

    // Take any available space
    const available = squares
      .map((val, idx) => (val === null ? idx : null))
      .filter((val) => val !== null) as number[];
    return available[Math.floor(Math.random() * available.length)];
  };

  const handlePlayerMove = useCallback(
    (index: number) => {
      if (
        gameState.winner ||
        gameState.board[index] !== null ||
        !gameState.isXNext
      ) {
        return;
      }

      // Start timer on first move
      if (!startTime) {
        setStartTime(Date.now());
      }

      const newBoard = [...gameState.board];
      newBoard[index] = "X";

      const winner = calculateWinner(newBoard);
      if (winner) {
        setGameState({
          board: newBoard,
          isXNext: false,
          winner,
          moveCount: gameState.moveCount + 1,
        });
        return;
      }

      // Computer move
      const computerIndex = getComputerMove(newBoard);
      newBoard[computerIndex] = "O";

      const computerWinner = calculateWinner(newBoard);
      setGameState({
        board: newBoard,
        isXNext: true,
        winner: computerWinner,
        moveCount: gameState.moveCount + 2,
      });
    },
    [gameState, startTime],
  );

  const resetGame = useCallback(() => {
    setGameState({
      board: Array(9).fill(null),
      isXNext: true,
      winner: null,
      moveCount: 0,
    });
    setStartTime(null);
    setElapsedTime(0);
  }, []);

  return {
    ...gameState,
    elapsedTime,
    handlePlayerMove,
    resetGame,
  };
};
