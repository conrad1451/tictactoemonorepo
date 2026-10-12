# ADR-014: Adopt Vitest for unit tests on both frontend and backend

## Status
- **Status:** Accepted
- **Date:** 2026-10-03
- **Authors:** Conrad Hansen-Quartey
- **Deciders:** Conrad Hansen-Quartey

## Context
No test files or CI configuration existed anywhere in the history through Oct 2 (flagged as a gap in ADR-002 and ADR-003). As the frontend and backend were broken into smaller, pure modules (ADR-015, the `cors.ts` extraction in ADR-013, and backend leaderboard/profile helpers), those modules became cheap to test in isolation.

- Frontend: `ea8aded` adds `vitest`; `6fbe94d` upgrades Vite 4 → 7 and `@vitejs/plugin-react` 4 → 5, because Vitest 5 requires Vite ≥ 6.4, and adds `jsdom` and `@testing-library/react` for hook tests (`useAuth.test.ts`, `useLeaderboard.test.ts`).
- Backend: `02affb5` adds `vitest` and excludes `*.test.ts` from the `tsc` build, so test files don't ship in `dist/`.
- Coverage added in this window: pure game rules and the computer player (`b6f0f1e`), `useAuth` and `useLeaderboard` hooks including a deliberate out-of-order-response race test, `isOriginAllowed` (`1218093`), and the leaderboard pipeline and duplicate-key-error helpers (`27ea6f0`).

## Decision
We will use Vitest as the test runner for both projects. Frontend tests that touch the DOM or hooks use `@testing-library/react` with a `jsdom` environment (`// @vitest-environment jsdom`); pure logic tests need no environment. Backend tests run against real in-process Express instances with fakes/stubs for auth and storage, rather than mocking at the HTTP layer. `pnpm test` runs Vitest in watch mode; `pnpm test:run` runs once (for scripts or CI).

## Consequences

### Positive (Pros)
- **Regressions get caught close to the change:** the leaderboard race fix and the CORS pattern allow-list both shipped with tests asserting the exact bug they fix.
- **Fast, dependency-light tests:** pure modules (`rules.ts`, `computerPlayer.ts`, `cors.ts`, `leaderboardPipeline.ts`) test without a browser, a database, or Descope.
- **One test tool across the repo:** both projects share Vitest's API and config shape.

### Negative (Cons / Trade-offs)
- **No CI configuration yet:** nothing in this log adds a GitHub Actions workflow (or similar) to run `test:run` on push or PR, so tests are currently opt-in and manual.
- **Large dependency bump:** Vite 4 → 7 is a major jump pulled in as a side effect of adding Vitest, not evaluated on its own merits. Confirm the production build output and the `vite.config.ts` plugin list still behave as expected.
- **Partial coverage:** route handlers that touch Mongoose directly (`scores.ts`'s `POST /scores`, `GET /scores/user/:userId`) aren't covered yet; only the pure helpers extracted out of them are.
