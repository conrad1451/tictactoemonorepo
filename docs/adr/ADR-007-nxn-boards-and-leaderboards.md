# ADR-007: Support NxN boards (3–7) with per-size leaderboards

## Status
- **Status:** Accepted
- **Date:** 2026-09-01
- **Authors:** Conrad Hansen-Quartey
- **Deciders:** Conrad Hansen-Quartey

## Context
The original game was 3x3 only, and the frontend recorded only winning times. Two earlier changes set the groundwork:

- `30c5df5` (Aug 24): the frontend records win, loss, and draw results (previously wins only).
- `c79ac39` (Sep 1): adds a `boardSize` parameter throughout, dynamic NxN rendering and win detection, a board-size selector, and per-size leaderboard tabs.
- `0084af2`: restores the computer opponent (`getComputerMove`) for variable sizes.
- Times on different board sizes are not comparable, so a single leaderboard would be misleading.

## Decision
We will support board sizes 3 through 7. Each result is stored with `boardSize` (default 3), and the leaderboard is computed per board size. It ranks only wins, taking each user's best time, top 10. The API contract is:

- `POST /api/scores` with `{ result, timeSeconds, boardSize }` (auth required).
- `GET /api/leaderboard?boardSize=N` (public).
- `GET /api/scores/user/:userId` (public).

A win requires a complete row, column, or diagonal of the full board size.

## Consequences

### Positive (Pros)
- **Replayability:** larger boards give players new challenges and separate leaderboards.
- **Fair ranking:** leaderboards never mix times across board sizes.
- **Complete history:** losses and draws are recorded, not just wins.

### Negative (Cons / Trade-offs)
- **Contract churn:** the query parameter was renamed `boardSize` → `board_size` → `boardSize` within an hour (`80618c3`, `ef556b9`). The API contract is documented nowhere except code.
- **Balance:** requiring a full line on a 7x7 board likely makes wins rare against the computer, which may thin the larger leaderboards. This is a prediction, not measured.
- **Trusted client:** times are client-reported (see ADR-002).
- **Guest gap:** guests play but their results are never recorded (`3325fa5`).
