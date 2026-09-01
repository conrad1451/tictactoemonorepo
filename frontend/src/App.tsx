// frontend/src/App.ts

// CHQ: Created with Claude AI (Haiku) and modified with Gemini AI

import React, { useState, useEffect } from "react";
import { getLeaderboard } from "./services/api";
import { GameBoard } from "./components/GameBoard";

import { LeaderboardEntry } from "./types";

export const App: React.FC = () => {
  const [boardSize, setBoardSize] = useState<number>(3);
  const [currentView, setCurrentView] = useState<"home" | "game">("home");
  const [leaderboardSize, setLeaderboardSize] = useState<number>(3);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  // Fetch leaderboard when size changes
  useEffect(() => {
    getLeaderboard(leaderboardSize).then(setLeaderboard);
  }, [leaderboardSize]);

  const handleStartGame = (size: number) => {
    setBoardSize(size);
    setCurrentView("game");
  };

  if (currentView === "home") {
    return (
      <div className="homepage">
        <h1>Tic Tac Toe</h1>
        
        {/* Game Size Selection */}
        <section className="mode-selection">
          <h2>Select Game Size</h2>
          <div className="button-group">
            {[3, 4, 5, 6, 7].map((size) => (
              <button key={size} onClick={() => handleStartGame(size)}>
                {size}x{size} Mode
              </button>
            ))}
          </div>
        </section>

        {/* Dynamic Leaderboard by Size */}
        <section className="leaderboard-section">
          <h2>Leaderboard</h2>
          <div className="leaderboard-tabs">
            {[3, 4, 5, 6, 7].map((size) => (
              <button
                key={size}
                className={leaderboardSize === size ? "active" : ""}
                onClick={() => setLeaderboardSize(size)}
              >
                {size}x{size}
              </button>
            ))}
          </div>

          <ul>
            {leaderboard.map((entry: any, index) => (
              <li key={entry.userId || index}>
                #{index + 1} {entry.username} — {entry.bestTime}s ({entry.totalGames} games)
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

return (
    <div className="game-view">
      <GameBoard
        boardSize={boardSize}
        onBackToHome={() => setCurrentView("home")}
      />
    </div>
  );
};