# Architecture Decision Records

Decisions for the Tic Tac Toe monorepo (`frontend/` + `backend/`), reconstructed from the Git history of Aug 23 – Sep 23, 2026. Each record follows the ADR template in `ADR-000-template.md`.

| # | Decision | Status | Date |
|---|----------|--------|------|
| [001](ADR-001-monorepo-layout.md) | Keep frontend and backend in one repo as two independent projects | Accepted | 2026-08-23 |
| [002](ADR-002-frontend-react-vite.md) | Build the frontend with React, TypeScript, and Vite | Accepted | 2026-08-24 |
| [003](ADR-003-backend-express-typescript-esm.md) | Build the backend as an Express + TypeScript ES-module API | Accepted | 2026-08-24 |
| [004](ADR-004-descope-authentication.md) | Delegate authentication to Descope | Accepted | 2026-08-24 |
| [005](ADR-005-tidb-mysql-persistence.md) | Persist scores in TiDB Cloud (MySQL) via mysql2 | Superseded by ADR-008 | 2026-08-24 |
| [006](ADR-006-ai-attribution-comments.md) | Attribute AI-assisted code with `CHQ:` header comments | Accepted | 2026-08-24 |
| [007](ADR-007-nxn-boards-and-leaderboards.md) | Support NxN boards (3–7) with per-size leaderboards | Accepted | 2026-09-01 |
| [008](ADR-008-mongodb-atlas-mongoose.md) | Migrate persistence to MongoDB Atlas via Mongoose | Accepted | 2026-09-20 |
| [009](ADR-009-netlify-functions-deployment.md) | Deploy the backend as a Netlify Function using serverless-http | Accepted | 2026-09-20 |
| [010](ADR-010-cors-production-origin.md) | Restrict CORS to the production frontend origin | Superseded by ADR-012 | 2026-09-21 |
| [011](ADR-011-strip-api-prefix-in-express.md) | Strip the `/api` prefix inside Express and mount routers at root | Accepted | 2026-09-23 |
| [012](ADR-012-cors-env-allowlist.md) | Allow CORS from `FRONTEND_URL` and local Vite ports 5173–5178 | Accepted | 2026-09-23 |

## Adding a new ADR
Copy `ADR-000-template.md`, take the next number, and add a row above. If a new decision replaces an old one, set the old record's status to `Superseded by ADR-XX`.
