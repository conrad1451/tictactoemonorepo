// frontend/src/App.ts

// CHQ: Claude AI (Haiku) generated file

import React, { useState, useEffect } from "react";
import { useGameLogic } from "./hooks/useGameLogic";
import { GameBoard } from "./components/GameBoard";
import { GameStatus } from "./components/GameStatus";
import { AuthModal } from "./components/AuthModal";
import { saveScore, setAuthToken } from "./services/api";
import {
  saveAuthUser,
  getAuthUser,
  clearAuth,
  isAuthenticated,
} from "./services/auth";
import { AuthUser } from "./types";
import "./App.css";

const App: React.FC = () => {
  const game = useGameLogic();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  // Load auth user from storage on mount
  useEffect(() => {
    const stored = getAuthUser();
    if (stored) {
      setAuthUser(stored);
      setAuthToken(stored.sessionJwt);
    }
  }, []);

  // Auto-save score/match result when game finishes and user is authenticated
  useEffect(() => {
    // Check if the game is over (winner is 'X', 'O', or 'draw')
    const isGameOver = !!game.winner;

    if (isGameOver && authUser && !scoreSaved) {
      // Determine the match result string expected by backend
      const result: "win" | "loss" | "draw" =
        game.winner === "X" ? "win" : game.winner === "O" ? "loss" : "draw";

      // Pass both result and elapsedTime to API service
      saveScore(result, game.elapsedTime)
        .then(() => {
          setScoreSaved(true);
        })
        .catch((err) => {
          console.error("Failed to save score:", err);
        });
    }
  }, [game.winner, authUser, scoreSaved, game.elapsedTime]);

  const handleAuthSuccess = (user: AuthUser) => {
    setAuthUser(user);
    saveAuthUser(user);
    setAuthToken(user.sessionJwt);
    setScoreSaved(true);

    if (game.winner) {
      const result: "win" | "loss" | "draw" =
        game.winner === "X" ? "win" : game.winner === "O" ? "loss" : "draw";

      saveScore(result, game.elapsedTime).catch((err) => {
        console.error("Failed to save score:", err);
      });
    }
  };

  const handleLogout = () => {
    setAuthUser(null);
    clearAuth();
    setAuthToken(null);
  };

  const handleReset = () => {
    game.resetGame();
    setScoreSaved(false);
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
        ) : null}
      </header>

      <main className="app-main">
        <div className="game-container">
          <GameStatus
            winner={game.winner}
            isXNext={game.isXNext}
            elapsedTime={game.elapsedTime}
            onReset={handleReset}
            onShowAuth={() => setShowAuthModal(true)}
            isAuthenticated={!!authUser}
          />

          <GameBoard
            board={game.board}
            onCellClick={game.handlePlayerMove}
            disabled={!!game.winner || !game.isXNext}
          />

          <div className="info-box">
            <p>
              You are <strong>X</strong>, Computer is <strong>O</strong>
            </p>
            <p>
              Your move count: <strong>{game.moveCount}</strong>
            </p>
          </div>
        </div>
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        elapsedTime={game.elapsedTime}
      />
    </div>
  );
};

export default App;
