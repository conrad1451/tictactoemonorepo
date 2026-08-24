import React, { useState } from "react";
import { AuthUser } from "../types";
import "../styles/AuthModal.css";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
  elapsedTime: number;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  elapsedTime,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDescopeLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // This integrates with Descope SDK
      // You would use @descope/react-sdk for the actual implementation
      const mockUser: AuthUser = {
        userId: "user_" + Math.random().toString(36).substr(2, 9),
        email: "player@example.com",
        name: "Player",
        sessionJwt: "mock_jwt_token",
      };

      onAuthSuccess(mockUser);
      onClose();
    } catch (err) {
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <h2>Save Your Score</h2>
        <p>
          Sign in to save your winning time: <strong>{elapsedTime}s</strong>
        </p>

        {error && <div className="error-message">{error}</div>}

        <button
          className="btn btn-primary btn-large"
          onClick={handleDescopeLogin}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in with Descope"}
        </button>

        <p className="modal-note">
          Your score will be recorded and you can track your progress on the
          leaderboard.
        </p>
      </div>
    </div>
  );
};
