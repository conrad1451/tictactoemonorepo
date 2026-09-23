# ADR-009: Deploy the backend as a Netlify Function using serverless-http

## Status
- **Status:** Accepted
- **Date:** 2026-09-20
- **Authors:** Conrad Hansen-Quartey
- **Deciders:** Conrad Hansen-Quartey

## Context
Through Aug 31 the backend README described a long-running Express server deployed on Render (`app.listen`, `pnpm start`). The `serverless-mern` branch (PR #1) moved it to Netlify Functions (`2a1b60e`, `f862c31`, `7975faf`).

The frontend stays on Vercel, so the API remains a separate origin (see ADR-010).

## Decision
We will run the Express app as a single Netlify Function.

- `src/index.ts` exports the Express `app` and no longer calls `app.listen`.
- `netlify/functions/api.ts` wraps it with `serverless-http` and exports `handler`.
- `netlify.toml` sets `functions = "netlify/functions"` and one rewrite: `/api/*` → `/.netlify/functions/api/:splat` (status 200).
- `public/index.html` is a placeholder page for the API-only site.
- `netlify-cli` is a devDependency for local emulation, and `.netlify/` is gitignored.
- Configuration comes from Netlify environment variables (`MONGODB_URI`, `DESCOPE_PROJECT_ID`); `dotenv` is no longer loaded in `index.ts`.

## Consequences

### Positive (Pros)
- **No server to manage:** scale-to-zero hosting with no always-on process.
- **Reuse of Express code:** routes and middleware were kept largely intact through `serverless-http`.
- **Warm-invocation reuse:** the cached Mongo connection (ADR-008) survives across warm invocations.

### Negative (Cons / Trade-offs)
- **Cold starts:** the first request after idle time pays for function startup plus a database connection.
- **Routing complexity:** Netlify's rewrite and Express's mounting interact in subtle ways and took five commits to settle (ADR-011).
- **Local development:** with `app.listen` gone, `pnpm dev` no longer serves requests. Use `netlify dev` (via `netlify-cli`) instead. The backend README no longer documents how to run locally.
- **Heavier tree:** `netlify-cli` added several thousand lines to `pnpm-lock.yaml`, and a Netlify-generated `deno.lock` was committed.
