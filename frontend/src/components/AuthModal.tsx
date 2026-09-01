import React, { useState, useEffect } from "react";
import { Descope, getSessionToken, useUser } from "@descope/react-sdk";
import { AuthUser } from "../types";
import "../styles/AuthModal.css";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
  elapsedTime: number;
}

interface DescopeSuccessDetail {
  user?: {
    userId?: string;
    sub?: string;
    email?: string;
    name?: string;
    loginIds?: string[];
  };
  sessionJwt?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  elapsedTime,
}) => {

  // CHQ: Gemini AI: ALL hooks must be declared at the top level unconditionally
  const [error, setError] = useState<string | null>(null);
  const { user: sdkUser } = useUser();

  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  // CHQ: Gemini AI: Early return comes AFTER all hooks have been declared
  if (!isOpen) return null;

  const handleDescopeSuccess = (e: CustomEvent<DescopeSuccessDetail>) => {
    setError(null);

    const detail = e.detail ?? {};
    const descopeUser = detail.user ?? sdkUser ?? {};
    const sessionJwt = detail.sessionJwt ?? getSessionToken();

    if (!sessionJwt) {
      setError("Authentication failed. Please try again.");
      return;
    }

    // Safely extract sub if present on custom event detail object
    const sub = "sub" in descopeUser ? (descopeUser as { sub?: string }).sub : undefined;

    const authUser: AuthUser = {
      userId:
        descopeUser.userId ??
        sub ??
        descopeUser.loginIds?.[0] ??
        "",
      email: descopeUser.email ?? "",
      name: descopeUser.name ?? descopeUser.email ?? "Player",
      sessionJwt,
    };

    onAuthSuccess(authUser);
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

        <Descope
          flowId="sign-up-or-in"
          theme="light"
          onSuccess={handleDescopeSuccess}
          onError={handleDescopeError}
        />

        <p className="modal-note">
          Your score will be recorded and you can track your progress on the
          leaderboard.
        </p>
      </div>
    </div>
  );
};