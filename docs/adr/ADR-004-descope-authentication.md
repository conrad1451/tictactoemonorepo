# ADR-004: Delegate authentication to Descope

## Status
- **Status:** Accepted
- **Date:** 2026-08-24
- **Authors:** Conrad Hansen-Quartey
- **Deciders:** Conrad Hansen-Quartey

## Context
Scores must be tied to a player identity, but the project does not want to build or store credentials itself.

- The first implementation used a mock login on the frontend and a `fetch` to `https://api.descope.com/verify` on the backend. That endpoint does not exist (`81df779`).
- The frontend's `@descope/react-sdk` 1.0.x sent an outdated flow-start payload that produced "Unknown flow" / 404 errors, so it was upgraded to `^3.2.1` (`d94f59f`).
- The backend README documents that `validateSession()` checks the JWT locally against Descope's JWKS.
- Guests should still be able to play without signing in (`3325fa5`).

## Decision
We will use Descope for sign-up and sign-in.

- **Frontend:** `main.tsx` wraps the app in `<AuthProvider projectId={VITE_DESCOPE_PROJECT_ID}>`. `AuthModal` renders `<Descope flowId="sign-up-or-in" />`. The returned user and session JWT are kept in `localStorage` under `tic_tac_toe_auth` and sent as `Authorization: Bearer <jwt>`.
- **Backend:** the `verifyToken` middleware calls `@descope/node-sdk`'s `validateSession()`. The user ID is the token's `sub` claim, with name and email taken from the claims. The process throws at startup if `DESCOPE_PROJECT_ID` is unset.
- **Guests:** unauthenticated players can play, but their results are not submitted.

## Consequences

### Positive (Pros)
- **No credential handling:** the project stores no passwords and runs no reset or verification flows.
- **Local token validation:** the Node SDK avoids a network call per request.
- **Stable user key:** `sub` becomes the primary key for users in both databases (ADR-005, ADR-008).

### Negative (Cons / Trade-offs)
- **Vendor coupling:** the flow ID (`sign-up-or-in`) and project ID are environment-specific. The frontend and backend project IDs must match exactly, and Test and Production are separate.
- **Token storage:** the JWT is kept in `localStorage`, which is readable by any injected script (XSS).
- **Weak verify route:** `POST /auth/verify` only checks that `sessionJwt` is present in the body and returns success. Real validation happens only in `verifyToken` on protected routes. Confirm whether this route is used; if so, it should call the SDK.
