import React, { useState, useEffect } from "react";
import { Descope, getSessionToken, useUser } from "@descope/react-sdk";
import { AuthUser } from "../types";
import { DescopeSuccessDetail, mapDescopeSuccess } from "../services/descope";
import "../styles/AuthModal.css";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Return false if the session could not be saved; the modal then stays open with an error. */
  onAuthSuccess: (user: AuthUser) => boolean;
  /** Winning time to save. Omit when signing in from the header. */
  elapsedTime?: number;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess, elapsedTime }) => {
  // All hooks must be declared unconditionally, before the early return.
  const [error, setError] = useState<string | null>(null);
  const { user: sdkUser } = useUser();

  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDescopeSuccess = (e: CustomEvent<DescopeSuccessDetail>) => {
    setError(null);

    const authUser = mapDescopeSuccess(e.detail, sdkUser, getSessionToken());
    if (!authUser) {
      setError("Authentication failed. Please try again.");
      return;
    }

    if (!onAuthSuccess(authUser)) {
      setError("Signed in, but your session couldn't be saved. Check that browser storage is enabled.");
      return;
    }
    onClose();
  };

  const handleDescopeError: OnErrorEventHandlerNonNull = (event) => {
    if (event instanceof CustomEvent) {
      console.error("Descope auth error:", event.detail);
    } else {
      console.error("Descope auth error:", event);
    }
    setError("Authentication failed. Please try again.");
  };

  const hasTime = elapsedTime !== undefined && elapsedTime > 0;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <h2>{hasTime ? "Save Your Score" : "Sign In"}</h2>
        <p>
          {hasTime ? (
            <>
              Sign in to save your winning time: <strong>{elapsedTime}s</strong>
            </>
          ) : (
            "Sign in to save your scores and join the leaderboard."
          )}
        </p>

        {error && <div className="error-message">{error}</div>}

        <Descope flowId="sign-up-or-in" theme="light" onSuccess={handleDescopeSuccess} onError={handleDescopeError} />

        <p className="modal-note">
          Your score will be recorded and you can track your progress on the leaderboard.
        </p>
      </div>
    </div>
  );
};