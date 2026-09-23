# ADR-001: Keep frontend and backend in one repo as two independent projects

## Status
- **Status:** Accepted
- **Date:** 2026-08-23
- **Authors:** Conrad Hansen-Quartey
- **Deciders:** Conrad Hansen-Quartey

## Context
The project is a Tic Tac Toe game with a React/TypeScript frontend and a Node.js backend. The initial commit's README describes it as `tictactoemonorepo`.

- The API contract changes often, and many changes touch both sides at once (e.g. board-size support in `c79ac39`, path fixes in `ba2cd5b`).
- The two halves are hosted separately: the frontend on Vercel, the backend on Render and later Netlify (see ADR-009).
- It is a single-developer project, so heavy tooling (root workspace, CI, shared packages) has not been justified.
- History: `f804929` (initial commit), `3484482` (frontend), `eadd8af` (backend).

## Decision
We will keep `frontend/` and `backend/` in one Git repository as two independent pnpm projects. Each has its own `package.json`, lockfile, `tsconfig.json`, and README. We will not add a root-level workspace or a shared package for now.

## Consequences

### Positive (Pros)
- **Atomic cross-cutting changes:** a change to an endpoint and its client can land in one commit or PR.
- **Independent deploys:** each project builds and deploys on its own with no coupling between toolchains.
- **Simple onboarding:** one clone, one issue tracker, one PR history.

### Negative (Cons / Trade-offs)
- **Duplicated types:** both projects have their own `src/types/index.ts`, so the API contract lives in two places and can drift. The history has several contract-mismatch fixes (`d2a9888`, `80618c3`, `ef556b9`, `ba2cd5b`).
- **Subfolder deploy friction:** hosts must be pointed at a subdirectory. A Vite `base: "/frontend/"` attempt (`851562f`) was reverted one commit later (`4efbfbd`).
- **No automated checks:** no CI configuration or test files appear in the history, so type errors surface only during host builds (see the fixes `257050b` and `67a069a`).
- **No root commands:** `backend/pnpm-workspace.yaml` exists only to hold pnpm `allowBuilds` settings. There is no root `pnpm -r` workflow.
