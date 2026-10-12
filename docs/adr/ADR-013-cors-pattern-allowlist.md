# ADR-013: Extract CORS into cors.ts with a pattern allow-list, drop credentials mode

## Status
- **Status:** Accepted
- **Date:** 2026-10-08
- **Authors:** Conrad Hansen-Quartey
- **Deciders:** Conrad Hansen-Quartey

Supersedes ADR-012.

## Context
ADR-012's `FRONTEND_URL` allow-list held up, but three gaps surfaced in the next two weeks:

- A second production-like origin needed support, so `FRONTEND_URL_2` was added alongside `FRONTEND_URL` (`7ac5a12`, Oct 2).
- Development increasingly happened in GitHub Codespaces, whose preview origins (`https://<id>.app.github.dev`) are generated per-session and can't be listed individually (`1d3de73`, Oct 3).
- The origin-matching logic lived inline in `backend/src/index.ts`, which pulls in Express, Mongoose, and the Descope client — too much to load just to unit-test an allow/deny decision.

## Decision
We will extract the origin check into `backend/src/cors.ts`, exporting `isOriginAllowed(origin)`. It allows: no `Origin` header (non-browser callers), any exact match in `[FRONTEND_URL, FRONTEND_URL_2, localhost:5173–5178]`, or any origin matching `/^https:\/\/[a-z0-9-]+\.app\.github\.dev$/`. `index.ts` wires this into `cors({ origin: (origin, cb) => cb(null, isOriginAllowed(origin)), ... })` and no longer sets `credentials: true`, since auth is a Bearer token in the `Authorization` header, not a cookie, and pairing broad origin matching with credentialed requests is an unnecessary risk if cookie auth is ever added later.

## Consequences

### Positive (Pros)
- **Unit-testable in isolation:** `isOriginAllowed` is a pure function with no server bootstrap, covered by `backend/src/cors.test.ts` (added in ADR-014's testing push).
- **Codespaces support without an open wildcard:** the regex is scoped to `*.app.github.dev`, not `*` or a broad substring match.
- **Smaller attack surface:** removing `credentials: true` means a cookie-based session, if ever added, won't silently inherit this allow-list's reach.

### Negative (Cons / Trade-offs)
- **Two frontend-URL env vars:** `FRONTEND_URL` and `FRONTEND_URL_2` are separate, unlabeled slots rather than a list. A third production-like origin needs another code change and env var, same limitation ADR-012 already had.
- **Regex trust boundary:** the production API now accepts cross-origin calls from any `*.app.github.dev` subdomain, not just the author's own Codespace. The regex can't tell one Codespace from another.
