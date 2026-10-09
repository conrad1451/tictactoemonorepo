// frontend/src/hooks/useProfile.ts
// Loads the signed-in player's profile (their chosen username) and saves changes to it.

import { useCallback, useEffect, useRef, useState } from "react";
import { UserProfile } from "../types";
import { getMe, setUsername } from "../services/api";
import { ApiError } from "../services/apiClient";
import { validateUsername } from "../utils/username";

export interface ProfileApi {
  getMe: () => Promise<UserProfile>;
  setUsername: (username: string) => Promise<UserProfile>;
}

export type ProfileStatus = "idle" | "loading" | "ready" | "error";
export type SaveUsernameResult = { ok: true } | { ok: false; error: string };

const defaultApi: ProfileApi = { getMe, setUsername };

/** Pass the signed-in user's id, or null when signed out (nothing is fetched). */
export const useProfile = (userId: string | null, api: ProfileApi = defaultApi) => {
  const apiRef = useRef(api);
  apiRef.current = api;

  const [username, setUsernameState] = useState<string | null>(null);
  const [status, setStatus] = useState<ProfileStatus>("idle");

  useEffect(() => {
    setUsernameState(null);
    if (!userId) {
      setStatus("idle");
      return;
    }

    let ignore = false; // a different user may have signed in before this resolves
    setStatus("loading");
    apiRef.current
      .getMe()
      .then((profile) => {
        if (ignore) return;
        setUsernameState(profile.username ?? null);
        setStatus("ready");
      })
      .catch((err) => {
        if (ignore) return;
        console.error("Failed to load profile:", err);
        setStatus("error"); // never block play because the profile couldn't load
      });

    return () => {
      ignore = true;
    };
  }, [userId]);

  const saveUsername = useCallback(async (raw: string): Promise<SaveUsernameResult> => {
    const check = validateUsername(raw);
    if (!check.ok) return { ok: false, error: check.error };

    try {
      const profile = await apiRef.current.setUsername(check.username);
      setUsernameState(profile.username ?? check.username);
      setStatus("ready");
      return { ok: true };
    } catch (err) {
      if (err instanceof ApiError && (err.status === 409 || err.status === 400)) {
        return {
          ok: false,
          error: err.serverMessage ?? (err.status === 409 ? "That username is taken." : "That username isn't valid."),
        };
      }
      console.error("Failed to save username:", err);
      return { ok: false, error: "Couldn't save your username. Please try again." };
    }
  }, []);

  return {
    username,
    status,
    /** Signed in, profile loaded, and no username chosen yet. */
    needsUsername: status === "ready" && username === null,
    saveUsername,
  };
};
