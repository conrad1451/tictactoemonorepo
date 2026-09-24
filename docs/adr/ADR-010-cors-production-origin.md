# ADR-010: Restrict CORS to the production frontend origin

## Status
- **Status:** Superseded by ADR-012
- **Date:** 2026-09-21
- **Authors:** Conrad Hansen-Quartey
- **Deciders:** Conrad Hansen-Quartey

## Context
The frontend (Vercel) and backend (Netlify) are on different origins, and authenticated requests send an `Authorization` header, which triggers CORS preflight.

- On Aug 24 (`58c5bb5`) the backend used a dynamic allow-list: `localhost:5173`–`5176` plus `FRONTEND_URL`.
- The Sep 20 serverless rewrite removed CORS handling entirely, so preflight requests failed (`2d22add`).

## Decision
We will allow exactly one origin, `https://tictactoebro.vercel.app`, with methods `GET, POST, PUT, DELETE, OPTIONS`, headers `Content-Type` and `Authorization`, and `credentials: true`. The value is hardcoded in `src/index.ts`.

## Consequences

### Positive (Pros)
- **Strict by default:** only the production site can call the API from a browser.
- **Simple:** no environment plumbing to maintain.

### Negative (Cons / Trade-offs)
- **Local development blocked:** a Vite dev server on `localhost:5173` is not an allowed origin. The earlier `localhost` allow-list was dropped.
- **Preview deployments blocked:** Vercel preview URLs are different origins and are rejected.
- **Code change to move domains:** changing the frontend URL requires a code change and redeploy. Restoring an env-based allow-list (`FRONTEND_URL`) would fix this and the two points above.
- **Redundant handler:** `app.options('*', cors())` is registered after the main `cors(...)` middleware. That middleware already terminates preflight requests, so the extra permissive handler appears to be dead code.
