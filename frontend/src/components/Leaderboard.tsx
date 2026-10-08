import React from "react";
import { BOARD_SIZES } from "../game/rules";
import { FetchLeaderboard, useLeaderboard } from "../hooks/useLeaderboard";

interface LeaderboardProps {
  size: number;
  onSizeChange: (size: number) => void;
  sizes?: readonly number[];
  /** Injectable for tests; defaults to the real API. */
  fetchLeaderboard?: FetchLeaderboard;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  size,
  onSizeChange,
  sizes = BOARD_SIZES,
  fetchLeaderboard,
}) => {
  const { entries, status } = useLeaderboard(size, fetchLeaderboard);

  return (
    <section className="leaderboard-section" style={{ marginTop: "25px" }}>
      <h2>Leaderboard</h2>
      <div className="leaderboard-tabs" style={{ display: "flex", gap: "5px", margin: "10px 0" }}>
        {sizes.map((s) => (
          <button
            key={s}
            className={`btn btn-small ${size === s ? "btn-primary" : "btn-secondary"}`}
            onClick={() => onSizeChange(s)}
          >
            {`${s}x${s}`}
          </button>
        ))}
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {status === "loading" && <li style={{ padding: "8px 0" }}>Loading…</li>}
        {status === "error" && <li style={{ padding: "8px 0" }}>Couldn't load the leaderboard.</li>}
        {status === "success" && entries.length === 0 && (
          <li style={{ padding: "8px 0" }}>No scores recorded yet.</li>
        )}
        {status === "success" &&
          entries.map((entry, index) => (
            <li key={entry.userId || index} style={{ padding: "6px 0", borderBottom: "1px solid #eee" }}>
              {`#${index + 1} ${entry.username} — ${entry.bestTime}s (${entry.totalGames} games)`}
            </li>
          ))}
      </ul>
    </section>
  );
};