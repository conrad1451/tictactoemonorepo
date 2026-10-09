import React, { useEffect, useState } from "react";
import { SaveUsernameResult } from "../hooks/useProfile";
import { USERNAME_MAX } from "../utils/username";
import "../styles/AuthModal.css";
import "../styles/UsernameModal.css";

interface UsernameModalProps {
  isOpen: boolean;
  /** Prefills the input and switches the wording to "change". */
  currentUsername?: string | null;
  onSubmit: (username: string) => Promise<SaveUsernameResult>;
  /** Skip / cancel / ×. The player can always come back from the header. */
  onClose: () => void;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({ isOpen, currentUsername, onSubmit, onClose }) => {
  // All hooks before the early return.
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValue(currentUsername ?? "");
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen, currentUsername]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await onSubmit(value);
    setSubmitting(false);
    if (!result.ok) setError(result.error);
  };

  const isChange = Boolean(currentUsername);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <h2>{isChange ? "Change your username" : "Choose a username"}</h2>
        <p>This is the name shown on the leaderboard. Use 3–20 letters, numbers, underscores or hyphens.</p>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <form className="username-form" onSubmit={handleSubmit}>
          <input
            className="username-input"
            aria-label="Username"
            value={value}
            maxLength={USERNAME_MAX}
            autoFocus
            autoComplete="off"
            onChange={(e) => setValue(e.target.value)}
          />
          <div className="username-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              {isChange ? "Cancel" : "Skip for now"}
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              Save username
            </button>
          </div>
        </form>

        <p className="modal-note">Your email is never shown to other players.</p>
      </div>
    </div>
  );
};
