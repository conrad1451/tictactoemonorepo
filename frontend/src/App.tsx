// frontend/src/App.tsx

import React, { useState } from "react";
import { GameBoard } from "./components/GameBoard";
import { AuthModal } from "./components/AuthModal";
import { ModeSelection } from "./components/ModeSelection";
import { Leaderboard } from "./components/Leaderboard";
import { useAuth } from "./hooks/useAuth";
import "./App.css";

export const App: React.FC = () => {
  const [boardSize, setBoardSize] = useState<number>(3);
  const [currentView, setCurrentView] = useState<"home" | "game">("home");
  const [leaderboardSize, setLeaderboardSize] = useState<number>(3);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { authUser, login, logout } = useAuth();

  const handleStartGame = (size: number) => {
    setBoardSize(size);
    setCurrentView("game");
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎮 Tic Tac Toe</h1>
        <p>Beat the computer and save your time!</p>

        {authUser ? (
          <div className="user-info">
            <span>{`Welcome, ${authUser.name}!`}</span>
            <button className="btn btn-secondary btn-small" onClick={logout}>
              Sign Out
            </button>
          </div>
        ) : (
          <div className="user-info">
            <button className="btn btn-primary btn-small" onClick={() => setShowAuthModal(true)}>
              Sign In
            </button>
          </div>
        )}
      </header>

      <main className="app-main">
        {currentView === "home" ? (
          <div className="game-container">
            <ModeSelection onStart={handleStartGame} />
            <Leaderboard size={leaderboardSize} onSizeChange={setLeaderboardSize} />
          </div>
        ) : (
          <GameBoard boardSize={boardSize} onBackToHome={() => setCurrentView("home")} />
        )}
      </main>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={login} />
    </div>
  );
};

export default App;