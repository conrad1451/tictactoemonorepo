# ADR-012: Allow CORS from `FRONTEND_URL` and local Vite ports 5173–5178

## Status
- **Status:** Accepted
- **Date:** 2026-09-23
- **Authors:** Conrad Hansen-Quartey
- **Deciders:** Conrad Hansen-Quartey

Supersedes ADR-010.

## Context
ADR-010 restricted CORS to one hardcoded origin, `https://tictactoebro.vercel.app`, in `backend/src/index.ts`. That left three problems:

- A local Vite dev server could not call the API. Vite moves to the next free port when 5173 is taken (`server.port` is set without `strictPort`), so local origins are not always 5173.
- Changing the frontend domain required a code change and a redeploy.
- The extra `app.options('*', cors())` handler was unreachable, because the main `cors(...)` middleware already terminates preflight requests.

## Decision
We will build the allow-list from `process.env.FRONTEND_URL` (trailing slash removed) plus `http://localhost:5173` through `http://localhost:5178`. Requests with no `Origin` header (curl, server-to-server) are allowed. Origins outside the list receive no CORS headers, with no error thrown. Methods (`GET, POST, PUT, DELETE, OPTIONS`), headers (`Content-Type`, `Authorization`), and `credentials: true` are unchanged. We will remove `app.options('*', cors())`.

## Consequences

### Positive (Pros)
- **Local development works:** the frontend can run on any of six ports against the deployed API.
- **Configurable per environment:** the production URL lives in Netlify environment variables, not in code.
- **Less dead code:** the redundant preflight handler is gone.

### Negative (Cons / Trade-offs)
- **Deploy dependency:** `FRONTEND_URL` must be set in Netlify. If it is missing, only the localhost origins are allowed and the production site is blocked.
- **One production origin:** `FRONTEND_URL` holds a single value, so Vercel preview URLs are still blocked. Supporting several would need a comma-separated list.
- **Localhost origins in production:** anyone running a dev server on ports 5173–5178 can call the API from their own browser. Protected routes still require a valid Descope JWT, which is sent as a Bearer header rather than a cookie.
