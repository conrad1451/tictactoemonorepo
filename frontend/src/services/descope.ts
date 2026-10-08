// frontend/src/services/descope.ts
// Pure mapping from Descope's success event to our AuthUser. No SDK import, so it's trivially testable.

// CHQ: Claude AI (Sonnet) generated file

import { AuthUser } from "../types";

export interface DescopeUserLike {
  userId?: string;
  sub?: string;
  email?: string;
  name?: string;
  loginIds?: string[];
}

export interface DescopeSuccessDetail {
  user?: DescopeUserLike;
  sessionJwt?: string;
}

/**
 * Returns null when we can't build a usable session (no JWT or no user id).
 * A user without an id would be rejected by the auth store on the next page load,
 * so it's better to fail the sign-in now than to appear signed in until a refresh.
 */
export const mapDescopeSuccess = (
  detail: DescopeSuccessDetail | undefined,
  sdkUser: DescopeUserLike | undefined,
  fallbackToken: string | null | undefined
): AuthUser | null => {
  const user = detail?.user ?? sdkUser ?? {};
  const sessionJwt = detail?.sessionJwt || fallbackToken;
  const userId = user.userId || user.sub || user.loginIds?.[0];

  if (!sessionJwt || !userId) return null;

  return {
    userId,
    email: user.email ?? "",
    name: user.name || user.email || "Player",
    sessionJwt,
  };
};