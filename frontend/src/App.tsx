// frontend/src/App.ts

// CHQ: Created with Claude AI (Haiku) and modified with Gemini AI

import React, { useState, useEffect } from "react";
import { getLeaderboard, setAuthToken, saveScore } from "./services/api";
import { GameBoard } from "./components/GameBoard";
import { AuthModal } from "./components/AuthModal";
import {
  saveAuthUser,
  getAuthUser,
  clearAuth,
} from "./services/auth";
import { AuthUser, LeaderboardEntry } from "./types";
import "./App.css";

export const App: React.FC = () => {
  const [boardSize, setBoardSize] = useState<number>(3);
  const [currentView, setCurrentView] = useState<"home" | "game">("home");
  const [leaderboardSize, setLeaderboardSize] = useState<number>(3);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Restore session on mount and after redirect back from auth provider
  useEffect(() => {
    const stored = getAuthUser();
    if (stored) {
      setAuthUser(stored);
      setAuthToken(stored.sessionJwt);
    }
  }, []);

  // Fetch leaderboard when target board size changes
  useEffect(() => {
    getLeaderboard(leaderboardSize)
      .then(setLeaderboard)
      .catch((err) => console.error("Failed to fetch leaderboard:", err));
  }, [leaderboardSize]);

  const handleStartGame = (size: number) => {
    setBoardSize(size);
    setCurrentView("game");
  };

  const handleAuthSuccess = (user: AuthUser) => {
    setAuthUser(user);
    saveAuthUser(user);
    setAuthToken(user.sessionJwt);
  };

  const handleLogout = () => {
    setAuthUser(null);
    clearAuth();
    setAuthToken(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎮 Tic Tac Toe</h1>
        <p>Beat the computer and save your time!</p>

        {authUser ? (
          <div className="user-info">
            <span>Welcome, {authUser.name}!</span>
            <button
              className="btn btn-secondary btn-small"
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="user-info">
            <button
              className="btn btn-primary btn-small"
              onClick={() => setShowAuthModal(true)}
            >
              Sign In
            </button>
          </div>
        )}
      </header>

      <main className="app-main">
        {currentView === "home" ? (
          <div className="game-container">
            <section className="mode-selection">
              <h2>Select Game Size</h2>
              <div className="button-group" style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "15px 0" }}>
                {[3, 4, 5, 6, 7].map((size) => (
                  <button
                    key={size}
                    className="btn btn-primary"
                    onClick={() => handleStartGame(size)}
                  >
                    {size}x{size} Mode
                  </button>
                ))}
              </div>
            </section>

            <section className="leaderboard-section" style={{ marginTop: "25px" }}>
              <h2>Leaderboard</h2>
              <div className="leaderboard-tabs" style={{ display: "flex", gap: "5px", margin: "10px 0" }}>
                {[3, 4, 5, 6, 7].map((size) => (
                  <button
                    key={size}
                    className={`btn btn-small ${leaderboardSize === size ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setLeaderboardSize(size)}
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>

              <ul style={{ listStyle: "none", padding: 0 }}>
                {leaderboard.length === 0 ? (
                  <li style={{ padding: "8px 0" }}>No scores recorded yet.</li>
                ) : (
                  leaderboard.map((entry, index) => (
                    <li key={entry.userId || index} style={{ padding: "6px 0", borderBottom: "1px solid #eee" }}>
                      #{index + 1} {entry.username} — {entry.bestTime}s ({entry.totalGames} games)
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        ) : (
          <GameBoard
            boardSize={boardSize}
            onBackToHome={() => setCurrentView("home")}
          />
        )}
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        elapsedTime={0}
        // elapsedTime?: number; // Made optional
      />
    </div>
  );
};

export default App;