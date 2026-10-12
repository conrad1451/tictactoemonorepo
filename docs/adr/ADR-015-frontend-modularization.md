# ADR-015: Break the frontend into pure game logic, hooks, and a shared API client

## Status
- **Status:** Accepted
- **Date:** 2026-10-06
- **Authors:** Conrad Hansen-Quartey
- **Deciders:** Conrad Hansen-Quartey

## Context
By Oct 3, `useGameLogic.ts` mixed board rules, win detection, computer-move selection, a timer, and score submission in one hook (see ADR-002, ADR-007). That made the computer-opponent change (the `SMART_MOVE_CHANCE` fix) hard to unit test in isolation, and ADR-014 established Vitest as the test runner. Three refactor passes followed:

- `974631f`: pure, framework-free modules — `game/rules.ts` (`checkWinner`, `getWinningLines`, `createEmptyBoard`) and `game/computerPlayer.ts` (`getComputerMove`, now taking `smartMoveChance` and an injectable `random` function as explicit parameters instead of a module-level constant and `Math.random()`).
- `e34885b`: a single `createApiClient` (`frontend/src/services/apiClient.ts`) replacing hand-written `fetch` calls scattered across `api.ts`.
- `d3ac61a` / `0eceb9f` / `52cb34a`: a pure `gameReducer` for board/turn/winner state and a standalone `useTimer` hook, with `useGameLogic` rewritten to drive both rather than holding scattered `useState` calls directly.
- `f6e3407` / `3ba8b3a`: `ModeSelection` and `Leaderboard` extracted as components, and `App.tsx` rewired onto `useAuth` (`9839f4d`) and `useLeaderboard` (`6fd7ad8`, see ADR-016) in place of inline state and effects.

## Decision
We will keep game rules, the computer player, and the leaderboard/auth hooks as small, dependency-injected, framework-independent modules under `frontend/src/game/` and `frontend/src/hooks/`, each with a matching `*.test.ts`. Randomness and network calls are passed in as parameters (`random`, `fetchLeaderboard`) rather than reached for globally, so tests can be deterministic. `useGameLogic` becomes a thin composition of `gameReducer`, `useTimer`, and the pure rules modules.

## Consequences

### Positive (Pros)
- **Testable without a browser:** `rules.ts` and `computerPlayer.ts` test as plain functions; the computer-opponent difficulty from `32d8d9d` is now covered directly rather than only verified by playing the game.
- **Single API surface:** `createApiClient` centralizes base-URL handling, auth-header injection, and error handling, so individual endpoint functions (`saveScore`, `getLeaderboard`, profile calls) stay thin.
- **Smaller, focused components:** `ModeSelection` and `Leaderboard` can change independently of `App.tsx`'s auth and routing concerns.

### Negative (Cons / Trade-offs)
- **More files to navigate:** what was one hook is now split across `rules.ts`, `computerPlayer.ts`, `gameReducer`, `useTimer`, and `useGameLogic` — more indirection for a small game.
- **Partial migration:** `useGameLogic` was rewritten onto the reducer and timer, but it is not itself covered by a dedicated test file in this log; only its extracted pieces are.
