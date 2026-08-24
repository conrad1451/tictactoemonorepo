import React from "react";
import { Board as BoardType } from "../types";
import "../styles/GameBoard.css";

interface GameBoardProps {
  board: BoardType;
  onCellClick: (index: number) => void;
  disabled: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  onCellClick,
  disabled,
}) => {
  return (
    <div className="game-board">
      {board.map((value, index) => (
        <button
          key={index}
          className={`cell ${value ? value.toLowerCase() : ""}`}
          onClick={() => onCellClick(index)}
          disabled={disabled || value !== null}
        >
          {value}
        </button>
      ))}
    </div>
  );
};
