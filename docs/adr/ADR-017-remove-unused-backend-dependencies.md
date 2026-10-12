# ADR-017: Remove mysql2, @types/mongoose, and tsx from the backend

## Status
- **Status:** Accepted
- **Date:** 2026-10-03
- **Authors:** Conrad Hansen-Quartey
- **Deciders:** Conrad Hansen-Quartey

## Context
ADR-008 (the MySQL → MongoDB migration, Sep 20) left three dependencies in `backend/package.json` that nothing imported: `mysql2` (the old TiDB client), `@types/mongoose` (a stub for an old Mongoose major; Mongoose 9 ships its own types), and `tsx` (an alternate TypeScript runner not used by any script). Both were flagged as likely cleanup in ADR-008 at the time.

## Decision
We will remove `mysql2`, `@types/mongoose`, and `tsx` from `backend/package.json` (`ae77c1c`).

## Consequences

### Positive (Pros)
- **Smaller install and attack surface:** fewer transitive dependencies to audit or receive security advisories for.
- **Closes out ADR-008's cleanup item:** the leftover-dependency trade-off noted there no longer applies.

### Negative (Cons / Trade-offs)
- **None identified.** This is a pure removal of unused code; the `dev` script already ran through `ts-node`, not `tsx`.
