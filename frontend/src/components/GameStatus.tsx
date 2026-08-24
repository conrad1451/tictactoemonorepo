import React from "react";
import { CellValue } from "../types";
import "../styles/GameStatus.css";

interface GameStatusProps {
  winner: CellValue | "Draw" | null;
  isXNext: boolean;
  elapsedTime: number;
  onReset: () => void;
  onShowAuth: () => void;
  isAuthenticated: boolean;
}

export const GameStatus: React.FC<GameStatusProps> = ({
  winner,
  isXNext,
  elapsedTime,
  onReset,
  onShowAuth,
  isAuthenticated,
}) => {
  const getStatusMessage = (): string => {
    if (winner === "X") {
      return `🎉 You won in ${elapsedTime}s!`;
    }
    if (winner === "O") {
      return "❌ Computer wins!";
    }
    if (winner === "Draw") {
      return "🤝 It's a draw!";
    }
    return `${isXNext ? "Your" : "Computer's"} turn`;
  };

  return (
    <div className="game-status">
      <div className="status-message">{getStatusMessage()}</div>
      <div className="timer">⏱️ {elapsedTime}s</div>

      {winner && (
        <div className="actions">
          <button className="btn btn-primary" onClick={onReset}>
            Play Again
          </button>
          {winner === "X" && !isAuthenticated && (
            <button className="btn btn-secondary" onClick={onShowAuth}>
              Save Score
            </button>
          )}
          {winner === "X" && isAuthenticated && (
            <div className="score-saved">✓ Score saved!</div>
          )}
        </div>
      )}
    </div>
  );
};
