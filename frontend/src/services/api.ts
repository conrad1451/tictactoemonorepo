// frontend/src/services/api.ts
// CHQ: Claude AI (Sonnet): Thin wiring of the real 
//      environment into the testable client.

import { getAuthUser } from "./auth";
import { createApiClient } from "./apiClient";

export const getAuthToken = (): string | null => getAuthUser()?.sessionJwt ?? null;

export const api = createApiClient({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  getToken: getAuthToken,
});

export const { saveScore, getLeaderboard, getUserStats, verifyAuth } = api;