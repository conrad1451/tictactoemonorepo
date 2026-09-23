# ADR-006: Attribute AI-assisted code with `CHQ:` header comments

## Status
- **Status:** Accepted
- **Date:** 2026-08-24
- **Authors:** Conrad Hansen-Quartey
- **Deciders:** Conrad Hansen-Quartey

## Context
Much of the code was written or edited with AI assistants (Gemini and Claude at different model tiers), often several on one file. The author wanted provenance visible in the source itself. Commit `7086d20` added file headers and attribution comments across the codebase.

## Decision
We will mark each source file with a path comment and a `CHQ:` attribution line naming the tool(s) involved, for example:

```ts
// backend/src/routes/auth.ts
// CHQ: refactored by Gemini AI
```

Notable individual changes get an inline `// CHQ: <tool>: <what changed>` comment. When a file's authorship changes, the header is updated (for example "Gemini AI generated, edited with Claude AI (Sonnet)").

## Consequences

### Positive (Pros)
- **Transparent provenance:** readers can see which parts were AI-generated without digging through history.
- **Review focus:** attributed regions are easy to find and review more carefully.

### Negative (Cons / Trade-offs)
- **Stale headers:** files are rewritten repeatedly, so headers drift (for example, `index.ts` went from "Claude AI (Haiku) generated" to "Gemini AI generated" in the Sep 20 rewrite while later fixes were made with Claude Sonnet). Git history remains the authoritative source.
- **Noise:** attribution comments add diff churn and clutter, and some inline comments (for example a long search-engine URL in `frontend/src/services/api.ts`) would be better replaced by a stable reference.
- **Manual upkeep:** nothing enforces the convention.
