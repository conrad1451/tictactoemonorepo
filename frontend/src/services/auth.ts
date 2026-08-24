// frontend/src/services/auth.ts

// CHQ: Claude AI (Haiku) generated file

import { AuthUser } from "../types";

const STORAGE_KEY = "tic_tac_toe_auth";

export const saveAuthUser = (user: AuthUser) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export const getAuthUser = (): AuthUser | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const clearAuth = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getAuthUser();
};
