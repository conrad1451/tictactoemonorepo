# ADR-011: Strip the `/api` prefix inside Express and mount routers at root

## Status
- **Status:** Accepted
- **Date:** 2026-09-23
- **Authors:** Conrad Hansen-Quartey
- **Deciders:** Conrad Hansen-Quartey

## Context
After moving to Netlify Functions (ADR-009), every request returned 404 until path handling was settled. The approach changed five times between Sep 20 and Sep 23:

1. `2a1b60e`: mount routers under `/.netlify/functions/api/auth` and `/scores`.
2. `ba2cd5b`: mount at root (`/auth`, `/scores`), drop the redundant `/auth` prefix inside the auth router, and rewrite `/api/*` cleanly in `netlify.toml`.
3. `905c116`: add middleware to strip `/.netlify/functions/api` from `req.url`.
4. `80885be`: mount the score routes at `/` so `/scores` and `/leaderboard` both resolve.
5. `13fe1dd`: strip `/api` instead. Netlify's `status = 200` rewrite passes the original request path (`/api/scores`) to the function, not the rewritten destination, so the earlier strip never matched and every request 404'd before reaching a route.

## Decision
We will strip a leading `/api` from `req.url` in a middleware that runs before routing (`/api/scores` → `/scores`, `/api` → `/`). Routers are mounted at root: auth at `/auth` and score routes at `/`, exposing `/scores`, `/scores/user/:userId`, and `/leaderboard`. The frontend always requests paths beginning with `/api`.

## Consequences

### Positive (Pros)
- **One rule:** the Express app is agnostic to Netlify internals, and the same route table serves any host that forwards `/api/...`.
- **Simple client contract:** every client call uses `${API_BASE_URL}/api/<route>`.

### Negative (Cons / Trade-offs)
- **Direct function URLs 404:** requests to `/.netlify/functions/api/...` are no longer stripped, so they miss the routers.
- **Base URL must be the site origin:** the client trims a trailing slash from `VITE_API_URL` and adds `/api` itself. `VITE_API_URL` must therefore be the backend origin with no `/api` suffix. The frontend README still documents `http://localhost:5000/api`, which would produce `/api/api/...`.
- **Inconsistent client helper:** `verifyAuth` in `frontend/src/services/api.ts` still calls `/auth/verify` without the `/api` prefix. Confirm it is unused, or update it.
- **Root-mounted catch-all:** `app.use('/', scoreRoutes)` means any future router mounted at `/` shares one namespace with the score routes.
