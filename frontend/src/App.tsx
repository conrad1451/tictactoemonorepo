// frontend/src/App.ts

// CHQ: Created with Claude AI (Haiku) and modified with Gemini AI

import React, { useState } from "react";
import { GameBoard } from "./components/GameBoard";
import { AuthModal } from "./components/AuthModal";
import { UsernameModal } from "./components/UsernameModal";
import { ModeSelection } from "./components/ModeSelection";
import { Leaderboard } from "./components/Leaderboard";
import { useAuth } from "./hooks/useAuth";
import { useProfile } from "./hooks/useProfile";
import "./App.css";

export const App: React.FC = () => {
  const [boardSize, setBoardSize] = useState<number>(3);
  const [currentView, setCurrentView] = useState<"home" | "game">("home");
  const [leaderboardSize, setLeaderboardSize] = useState<number>(3);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usernameModalOpen, setUsernameModalOpen] = useState(false); // opened from the header
  const [promptDismissedFor, setPromptDismissedFor] = useState<string | null>(null);

  const { authUser, login, logout } = useAuth();
  const profile = useProfile(authUser?.userId ?? null);

  // Prompt automatically right after the first sign-in, until the player picks or skips.
  const showUsernameModal =
    authUser !== null &&
    (usernameModalOpen || (profile.needsUsername && promptDismissedFor !== authUser.userId));

  const closeUsernameModal = () => {
    setUsernameModalOpen(false);
    if (authUser) setPromptDismissedFor(authUser.userId);
  };

  const handleSaveUsername = async (name: string) => {
    const result = await profile.saveUsername(name);
    if (result.ok) setUsernameModalOpen(false);
    return result;
  };

  const handleLogout = () => {
    setUsernameModalOpen(false);
    logout();
  };

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
            <span>{`Welcome, ${profile.username ?? authUser.name}!`}</span>
            {profile.status === "ready" && (
              <button className="btn btn-secondary btn-small" onClick={() => setUsernameModalOpen(true)}>
                {profile.username ? "Change username" : "Set username"}
              </button>
            )}
            <button className="btn btn-secondary btn-small" onClick={handleLogout}>
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
      <UsernameModal
        isOpen={showUsernameModal}
        currentUsername={profile.username}
        onSubmit={handleSaveUsername}
        onClose={closeUsernameModal}
      />
    </div>
  );
};

export default App;