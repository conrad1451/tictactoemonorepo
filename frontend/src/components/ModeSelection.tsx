import React from "react";
import { BOARD_SIZES } from "../game/rules";

interface ModeSelectionProps {
  onStart: (size: number) => void;
  sizes?: readonly number[];
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({ onStart, sizes = BOARD_SIZES }) => (
  <section className="mode-selection">
    <h2>Select Game Size</h2>
    <div className="button-group" style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "15px 0" }}>
      {sizes.map((size) => (
        <button key={size} className="btn btn-primary" onClick={() => onStart(size)}>
          {`${size}x${size} Mode`}
        </button>
      ))}
    </div>
  </section>
);