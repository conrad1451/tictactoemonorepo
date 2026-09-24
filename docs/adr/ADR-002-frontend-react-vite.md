# ADR-002: Build the frontend with React, TypeScript, and Vite

## Status
- **Status:** Accepted
- **Date:** 2026-08-24
- **Authors:** Conrad Hansen-Quartey
- **Deciders:** Conrad Hansen-Quartey

## Context
The game needs an interactive UI with a timer, a computer opponent, a sign-in modal, and a leaderboard, deployed as a static site.

- The initial scaffold (`3484482`) chose React 18, TypeScript, and Vite 4, with pnpm as the package manager.
- Configuration is read from `VITE_DESCOPE_PROJECT_ID` and `VITE_API_URL`.
- The site is hosted on Vercel (`4efbfbd`, and the CORS origin in ADR-010).
- Game and auth state is managed with React hooks and components (`useGameLogic`, `AuthModal`, `GameBoard`, `GameStatus`) and one CSS file per component. There is no router or state library.

## Decision
We will build the frontend as a Vite + React 18 + TypeScript single-page app, deployed as a static build to Vercel. Game rules, the timer, and the computer opponent run entirely in the browser (`useGameLogic`). The app talks to the backend only through `src/services/api.ts`.

## Consequences

### Positive (Pros)
- **Fast feedback loop:** the Vite dev server (port 5173) and static output keep local work and hosting simple.
- **Small surface area:** no router or state library to maintain.
- **Type safety:** shared TypeScript types cover components, hooks, and API responses.

### Negative (Cons / Trade-offs)
- **Client-authoritative results:** win detection, the elapsed time, and the win/loss outcome are computed in the browser and sent to the API. A modified client can submit any time to the leaderboard. The backend only checks that the fields are present.
- **Build-time config:** `VITE_*` values are baked into the bundle and are public. `VITE_API_URL` must be set correctly per environment (see ADR-011).
- **Missing tooling:** the `lint` script references ESLint, but no ESLint dependency appears in the `package.json` changes in this log. No tests appear either.
