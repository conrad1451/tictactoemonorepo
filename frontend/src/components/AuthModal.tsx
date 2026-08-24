import React, { useState } from "react";
import { Descope, getSessionToken } from "@descope/react-sdk";
import { AuthUser } from "../types";
import "../styles/AuthModal.css";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
  elapsedTime: number;
}

// Shape of the CustomEvent Descope's <Descope /> component fires on
// onSuccess. `sessionJwt` is included on the event in addition to `user`,
// but we fall back to getSessionToken() in case a given flow/version omits it.
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
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDescopeSuccess = (e: CustomEvent<DescopeSuccessDetail>) => {
    setError(null);

    const detail = e.detail ?? {};
    const descopeUser = detail.user ?? {};
    const sessionJwt = detail.sessionJwt ?? getSessionToken();

    if (!sessionJwt) {
      setError("Authentication failed. Please try again.");
      return;
    }

    const authUser: AuthUser = {
      userId:
        descopeUser.userId ??
        descopeUser.sub ??
        descopeUser.loginIds?.[0] ??
        "",
      email: descopeUser.email ?? "",
      name: descopeUser.name ?? descopeUser.email ?? "Player",
      sessionJwt,
    };

    onAuthSuccess(authUser);
    onClose();
  };

  // The Descope component's `onError` prop type is an intersection of the
  // DOM's `onerror` handler shape and a CustomEvent handler, so we accept
  // the loose `Event | string` shape and narrow to CustomEvent ourselves.
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
