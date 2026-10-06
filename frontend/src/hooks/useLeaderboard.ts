// frontend/src/hooks/useLeaderboard.ts

// CHQ: Claude AI (Sonnet) generated file

import { useEffect, useRef, useState } from "react";
import { LeaderboardEntry } from "../types";
import { getLeaderboard } from "../services/api";

export type LeaderboardStatus = "loading" | "success" | "error";
export type FetchLeaderboard = (boardSize: number) => Promise<LeaderboardEntry[]>;

export const useLeaderboard = (boardSize: number, fetchLeaderboard: FetchLeaderboard = getLeaderboard) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [status, setStatus] = useState<LeaderboardStatus>("loading");

  // Keep the latest fetcher without making it an effect dependency.
  const fetchRef = useRef(fetchLeaderboard);
  fetchRef.current = fetchLeaderboard;

  useEffect(() => {
    let ignore = false; // drops responses for a size the user already left (race fix)
    setStatus("loading");
    setEntries([]); // never show another board's scores under this tab

    fetchRef
      .current(boardSize)
      .then((data) => {
        if (ignore) return;
        setEntries(data);
        setStatus("success");
      })
      .catch((err) => {
        if (ignore) return;
        console.error("Failed to fetch leaderboard:", err);
        setStatus("error");
      });

    return () => {
      ignore = true;
    };
  }, [boardSize]);

  return { entries, status };
};