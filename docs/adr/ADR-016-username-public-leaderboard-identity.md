# ADR-016: Require a chosen username, and show only that on the leaderboard

## Status
- **Status:** Accepted
- **Date:** 2026-10-09
- **Authors:** Conrad Hansen-Quartey
- **Deciders:** Conrad Hansen-Quartey

## Context
Under ADR-005/ADR-008, the leaderboard displayed a player's Descope `name`, falling back to `email`, then to the literal string `"User"` (later `"Anonymous"`). That meant:

- A player's email address could appear on a public leaderboard if they had no display name set in Descope.
- `verifyToken` defaulted a missing `name` claim to the string `"User"` rather than leaving it blank, which then flowed into the fallback chain as if it were a real name.
- There was no concept of an in-app identity distinct from the auth provider's profile fields.

## Decision
We will add an optional `username` / `usernameLower` pair to the `User` model, with a case-insensitive unique index scoped only to documents that have a username (`partialFilterExpression`), so players without one don't collide on a shared `null`. `GET /me` and `PUT /me/username` (via `createMeRouter`) let a signed-in player read and set their username, validated by `validateUsername` (3–20 chars, letters/digits/`_`/`-`, a reserved-word list) and distinguishing a genuine username collision from other duplicate-key errors via `isDuplicateKeyError`. The frontend prompts for a username after sign-in (`UsernameModal`, `useProfile`). The leaderboard aggregation (`buildLeaderboardPipeline`) now projects only `username` (falling back to `"Anonymous"`, never `name` or `email`) alongside `userId`, `bestTime`, and `totalGames`. `pickProfile` also changed the score-saving upsert to never overwrite a stored `name`/`email` with a blank value, and `verifyToken` no longer invents a `"User"` placeholder for a missing name claim.

## Consequences

### Positive (Pros)
- **No PII on a public endpoint:** the leaderboard can no longer leak an email address; `leaderboardPipeline.test.ts` asserts `userDoc.email` and `userDoc.name` never appear in the pipeline's output shape.
- **Stable, chosen identity:** a username persists independent of what Descope reports, and survives a player updating their Descope profile.
- **Safe concurrent writes:** `isDuplicateKeyError` tells a username collision (from the partial unique index) apart from an unrelated duplicate-key error (e.g. on `_id` during a concurrent upsert), so the API can return the right error to the right cause.

### Negative (Cons / Trade-offs)
- **No backfill:** existing users and the 4 score documents already in Atlas (see the Sep 28 leaderboard conversation) predate this feature and have no `username`. They'll show as "Anonymous" until each player signs in and sets one.
- **New required step in onboarding:** sign-in is no longer the last step before playing ranked games; a username prompt follows it. Confirm whether skipping the modal is possible and what happens to a win recorded before a username is set.
- **Two source-of-truth fields:** `username` (display) and `usernameLower` (uniqueness key) must always be written together; nothing in the schema enforces that they stay in sync outside of `createMeRouter`'s own logic.
