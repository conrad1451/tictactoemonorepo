# ADR-005: Persist scores in TiDB Cloud (MySQL) via mysql2

## Status
- **Status:** Superseded by ADR-008
- **Date:** 2026-08-24
- **Authors:** Conrad Hansen-Quartey
- **Deciders:** Conrad Hansen-Quartey

## Context
The first backend kept scores and users in in-memory `Map`s, which are lost on every restart. The leaderboard endpoint queried a `Map` that nothing ever populated, so it always returned `[]` (`da85bf4`).

- A relational, MySQL-compatible hosted database (TiDB Cloud) was chosen (`f5903ad`, `c5ab870`).
- Scores reference users through a foreign key, and users are Descope IDs that no other code writes.
- Backend hosting at the time was Render.

## Decision
We will store data in TiDB Cloud using a `mysql2` connection pool (`DATABASE_URL`, TLS required, `connectionLimit: 10`).

- **Tables:** `users(id, name, email, created_at)` and `scores(id, user_id, result, time_seconds, created_at)`, with `scores.user_id` a foreign key to `users.id`.
- **Writes:** every score save first upserts the user with `INSERT ... ON DUPLICATE KEY UPDATE`, so name and email stay in sync with Descope claims (`b255d62`).
- **Reads:** stats use `COUNT`/`MIN`/`AVG`. The leaderboard uses a `LEFT JOIN` to `users`, falling back from name to email to `"Anonymous"`.

## Consequences

### Positive (Pros)
- **Durability:** scores survive restarts and redeploys.
- **Integrity:** the foreign key and SQL aggregates give consistent stats and leaderboard queries.

### Negative (Cons / Trade-offs)
- **FK ordering bug:** before the user upsert was added, every score insert failed with `ER_NO_REFERENCED_ROW_2`, hidden behind a generic 500 (`da85bf4`).
- **Manual migrations:** adding `name` and `email` required a hand-run `ALTER TABLE`; there was no migration tooling.
- **Long-lived pool:** a connection pool fits a persistent server poorly and was replaced when the backend went serverless (ADR-008, ADR-009).
