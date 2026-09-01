import React from "react";
import { useGameLogic } from "../hooks/useGameLogic";
import "../styles/GameBoard.css";

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

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="game-container">
      <header className="game-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <button className="btn btn-secondary btn-small" onClick={onBackToHome}>
          ← Home
        </button>
        <div className="game-info" style={{ textAlign: "center" }}>
          <h3>{boardSize} × {boardSize} Match</h3>
          <span className="timer">Time: {formatTime(timeSeconds)}</span>
        </div>
        <button className="btn btn-secondary btn-small" onClick={resetGame}>
          Restart
        </button>
      </header>

      <div className="status-banner" style={{ textAlign: "center", margin: "15px 0", fontWeight: "bold" }}>
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
              className={`cell ${cellValue ? cellValue.toLowerCase() : ""} ${
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