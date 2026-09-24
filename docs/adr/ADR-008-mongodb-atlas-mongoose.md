# ADR-008: Migrate persistence from TiDB/MySQL to MongoDB Atlas via Mongoose

## Status
- **Status:** Accepted
- **Date:** 2026-09-20
- **Authors:** Conrad Hansen-Quartey
- **Deciders:** Conrad Hansen-Quartey

Supersedes ADR-005.

## Context
The backend was being reworked for serverless deployment on a branch named `serverless-mern` (PR #1). The MySQL connection pool and SQL queries needed replacing (`2a1b60e`), and the README was updated to describe the new database (`0042632`).

> **Inferred:** the commit messages do not state why MongoDB was chosen. The `serverless-mern` branch name and the timing with the Netlify move (ADR-009) suggest a "MERN stack on serverless" goal. Please confirm or correct this rationale.

## Decision
We will use MongoDB Atlas through Mongoose 9 (`MONGODB_URI`).

- **User model:** `_id` is the Descope user ID (a string), plus `name`, `email`, and timestamps.
- **Score model:** `userId` (ref `User`), `result` (`win` | `loss` | `draw`), `timeSeconds`, `boardSize`, and timestamps. A compound index on `{ boardSize, result, timeSeconds }` supports the leaderboard.
- **Writes:** each score save upserts the user with `findByIdAndUpdate` (`upsert: true`), then calls `Score.create`.
- **Reads:** stats and the leaderboard use aggregation pipelines (`$group`, `$lookup` on `users`, `$sort`, `$limit`).
- **Connections:** `connectToDatabase()` caches the connection in module scope and runs in a middleware before every request.
- **Types:** `IUser extends Omit<Document, '_id'>` so the string `_id` does not clash with Mongoose's `ObjectId` typing (`257050b`).

## Consequences

### Positive (Pros)
- **Fits serverless:** a cached client connection is simpler than a pool in short-lived functions.
- **No schema migrations:** adding fields no longer needs `ALTER TABLE` scripts.
- **Convenient modeling:** the string `_id` reuses the Descope user ID directly.

### Negative (Cons / Trade-offs)
- **Lost referential integrity:** `ref: 'User'` is not enforced. Score rows are not guaranteed to have a matching user, and the leaderboard relies on `$lookup` with `preserveNullAndEmptyArrays`.
- **No data migration:** the history contains no script to move existing MySQL data. Old scores were either dropped or migrated outside the repo.
- **Leftover dependencies:** `mysql2` is still in `package.json`, and `@types/mongoose` (a stub for an old major) is listed alongside Mongoose 9, which ships its own types. Both look removable.
- **Thinner docs:** the README rewrite (`0042632`) dropped the environment-variable, schema, and API-endpoint sections. `MONGODB_URI` is now documented only in code.
