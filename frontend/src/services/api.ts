// frontend/src/services/api.ts

// CHQ: Claude AI (Haiku) generated file

// source: https://www.google.com/search?client=firefox-b-1-d&q=Property+%27env%27+does+not+exist+on+type+%27ImportMeta%27.&fbs=ABfTbFVyMZGZf1hfvX9uKjN_-G8cxpBkeIeqYwoCbfNVc4vKE-Dsslc-KGKq55jF_BVsFlCZ_qea3ZQNMU_L5SWbG8ROva_LKGdZoPsB7f_pNLAVJXfjUUevW1MGN8kGASBEENKSw5jez3QKVTgFG3uNig5lty5HLdHwdwNuFe6gusNikALPrGed9kFpvNm1TktJ9YCaoz5K-rXQwMkmag2DSr_PnWRPhA&aep=10&ntc=1&sxsrf=APpeQnvAGBupxpuvszK9HbGahB9_goP44A%3A1787574096995&mstk=AUtExfBU9ktY2GmlUzJeij2Vj6C_4SzNti3jHF7qMES8Wlf93oME415a13ut_p90aFhsCPTn1rk2RN9XLDsC_T4OFGg-EIa4l95TOz8zOoKxDKP9vQourwPQF_RRXGelBHJXNyQUzciJG7D_e-zQF0FZgViAudLjiY-3UziaOkojmo3aVbU3YBDb3lSkOQD4KWqjBxJOcURKHzXuIRo8AT-gc19XAMYGGIuyVlLkySl8uqsqkBFlBq0mNCoq0g1Uf4eUv86i6z_tXTsMSw&aioh=3&csuir=1&atvm=2&mtid=7lOMarezH8uV5OMPhcq5yA0&udm=50

import { UserStats, LeaderboardEntry } from "../types";
import { getAuthUser } from "./auth";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Local state to keep track of the JWT
let authToken: string | null = null;

// Sets or removes the auth token globally for this service
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

// Define getAuthToken using your existing auth module
export const getAuthToken = (): string | null => {
  const user = getAuthUser();
  return user ? user.sessionJwt : null;
};

// Internal helper to handle boilerplate fetch requests
const request = async (endpoint: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers);

  // Dynamically inject the token if it exists
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  // Set Content-Type if we are sending a JSON payload
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// API Endpoints

// CHQ: Gemini AI added boardSize parameter
export const saveScore = async (
  result: "win" | "loss" | "draw",
  timeSeconds: number,
  boardSize: number = 3,
) => {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/scores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ result, timeSeconds, boardSize }),
  });

  if (!response.ok) throw new Error("Failed to save score");
  return response.json();
};

// CHQ: Gemini AI added boardSize to leaderboard 
export const getLeaderboard = async (boardSize: number = 3) => {
  const response = await fetch(
    `${API_BASE_URL}/leaderboard?board_size=${boardSize}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard");
  }
  return response.json();
};
export const getUserStats = async (userId: string): Promise<UserStats> => {
  return request(`/api/scores/user/${userId}`, { method: "GET" });
};

export const verifyAuth = async (sessionJwt: string): Promise<any> => {
  return request("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ sessionJwt }),
  });
};
