# ADR-003: Build the backend as an Express + TypeScript ES-module API

## Status
- **Status:** Accepted
- **Date:** 2026-08-24
- **Authors:** Conrad Hansen-Quartey
- **Deciders:** Conrad Hansen-Quartey

## Context
The backend needs a small HTTP API to verify sign-ins and to record and query game results.

- The scaffold (`eadd8af`) chose Node.js with Express 4, `"type": "module"`, and TypeScript, built with `tsc` into `dist/`.
- Three follow-up fixes were needed to make the build work:
  - `ef85553` and `c655e29`: `tsconfig.json` was moved to `module`/`moduleResolution: NodeNext`. `noEmit` and `allowImportingTsExtensions` were removed so `dist/` is emitted. Relative imports now use `.js` extensions.
  - `3241984`: `@types/cors` was added as a devDependency.
  - `895176b`: `tslib` was added as a dependency.
- `67a069a` (Sep 23): TypeScript could not emit a portable `.d.ts` for the inferred `app` type (it resolved through a nested `@types/express-serve-static-core` path).
- Routes live in `src/routes/` (`auth.ts`, `scores.ts`), with auth in `src/middleware/auth.ts`.

## Decision
We will write the backend as native ES modules under TypeScript's `NodeNext` resolution. Relative imports will use `.js` extensions. Exported Express objects will carry explicit type annotations: `const app: Express = express()` and `const router: Router = Router()`.

## Consequences

### Positive (Pros)
- **Standards-based modules:** ESM output runs unchanged on modern Node and on the serverless bundler used in ADR-009.
- **Portable declarations:** explicit `Express` and `Router` annotations avoid the "not portable" declaration-emit error.
- **Familiar stack:** Express keeps routing and middleware (CORS, JSON parsing, auth) simple.

### Negative (Cons / Trade-offs)
- **Import ceremony:** `.js` extensions in `.ts` sources confuse newcomers and are easy to forget. Missing ones caused build errors in `ef85553` and `c655e29`.
- **Tooling drift:** `ts-node` and `tsx` are both installed, and the `dev` script (`node --loader ts-node/esm`) predates the serverless move. It no longer starts a listener (see ADR-009).
- **Express 4 pinned:** upgrading to Express 5 would need a routing review, including the `app.options('*', ...)` wildcard in ADR-010.
