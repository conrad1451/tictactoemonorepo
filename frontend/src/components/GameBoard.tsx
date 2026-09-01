import React from "react";
import { useGameLogic } from "../hooks/useGameLogic";

interface GameBoardProps {
  boardSize: number;
  onBackToHome: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ boardSize, onBackToHome }) => {
  const {
    board,
    isXNext,
    winner,
    winningLine,
    timeSeconds,
    isSubmitting,
    handleCellClick,
    resetGame,
  } = useGameLogic(boardSize, onBackToHome);

  // Format timer into MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="game-container">
      <header className="game-header">
        <button className="btn-back" onClick={onBackToHome}>
          ← Home
        </button>
        <div className="game-info">
          <h2>{boardSize} × {boardSize} Match</h2>
          <span className="timer">Time: {formatTime(timeSeconds)}</span>
        </div>
        <button className="btn-reset" onClick={resetGame}>
          Restart
        </button>
      </header>

      <div className="status-banner">
        {winner ? (
          winner === "draw" ? (
            <span className="status-draw">Game ended in a Draw!</span>
          ) : (
            <span className="status-win">Player {winner} Wins!</span>
          )
        ) : (
          <span className="status-turn">Turn: Player {isXNext ? "X" : "O"}</span>
        )}
      </div>

      <div
        className="game-board"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`,
          gap: "8px",
          maxWidth: `${Math.min(boardSize * 90, 600)}px`,
          margin: "0 auto",
        }}
      >
        {board.map((cellValue, index) => {
          const isWinningCell = winningLine?.includes(index);

          return (
            <button
              key={index}
              className={`cell ${cellValue ? `cell-${cellValue.toLowerCase()}` : ""} ${
                isWinningCell ? "winning-cell" : ""
              }`}
              onClick={() => handleCellClick(index)}
              disabled={!!cellValue || !!winner || isSubmitting}
            >
              {cellValue}
            </button>
          );
        })}
      </div>
    </div>
  );
};