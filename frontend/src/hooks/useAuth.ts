// frontend/src/hooks/useAuth.ts
// Owns the signed-in user and keeps React state and persisted 
// storage in sync in one place.

// CHQ: Claude AI (Sonnet) generated file

import { useCallback, useRef, useState } from "react";
import { AuthUser } from "../types";
import { getAuthUser, saveAuthUser, clearAuth } from "../services/auth";

export interface AuthStore {
  getAuthUser: () => AuthUser | null;
  saveAuthUser: (user: AuthUser) => boolean;
  clearAuth: () => void;
}

const defaultStore: AuthStore = { getAuthUser, saveAuthUser, clearAuth };

export const useAuth = (store: AuthStore = defaultStore) => {
  const storeRef = useRef(store);
  storeRef.current = store;

  // Restore the session synchronously on first render: no signed-out flash.
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => store.getAuthUser());

  /** Returns false (and stays signed out) if the session could not be persisted. */
  const login = useCallback((user: AuthUser): boolean => {
    if (!storeRef.current.saveAuthUser(user)) return false;
    setAuthUser(user);
    return true;
  }, []);

  const logout = useCallback(() => {
    storeRef.current.clearAuth();
    setAuthUser(null);
  }, []);

  return { authUser, isAuthenticated: authUser !== null, login, logout };
};