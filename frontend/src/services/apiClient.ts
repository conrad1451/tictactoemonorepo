// frontend/src/services/apiClient.ts

// CHQ: Claude AI (Sonnet) generated file
// Single request path for every backend call. No module-level state, no import.meta.env.

import { LeaderboardEntry, UserStats } from "../types";

export interface ApiClientOptions {
  /** API root including any prefix, e.g. "http://localhost:5000/api". */
  baseUrl: string;
  /** Called on every request, so there is one source of truth for the token. */
  getToken: () => string | null;
  /** Injectable for tests. Defaults to the global fetch (resolved at call time). */
  fetchFn?: typeof fetch;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly path: string
  ) {
    super(`API Error: ${status} ${statusText} (${path})`);
    this.name = "ApiError";
  }
}

export type GameResult = "win" | "loss" | "draw";

export const createApiClient = ({ baseUrl, getToken, fetchFn }: ApiClientOptions) => {
  const root = baseUrl.replace(/\/+$/, "");

  const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const headers = new Headers(init.headers);

    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const doFetch = fetchFn ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
    const response = await doFetch(`${root}${path}`, { ...init, headers });

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText, path);
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  };

  return {
    saveScore: (result: GameResult, timeSeconds: number, boardSize: number = 3) =>
      request<unknown>("/scores", {
        method: "POST",
        body: JSON.stringify({ result, timeSeconds, boardSize }),
      }),

    getLeaderboard: (boardSize: number = 3) =>
      request<LeaderboardEntry[]>(`/leaderboard?boardSize=${boardSize}`),

    getUserStats: (userId: string) =>
      request<UserStats>(`/scores/user/${encodeURIComponent(userId)}`),

    verifyAuth: (sessionJwt: string) =>
      request<unknown>("/auth/verify", {
        method: "POST",
        body: JSON.stringify({ sessionJwt }),
      }),
  };
};

export type ApiClient = ReturnType<typeof createApiClient>;