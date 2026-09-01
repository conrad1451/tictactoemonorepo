# Tic Tac Toe - Backend

Express + TypeScript API for the Tic Tac Toe game. Verifies Descope session tokens and persists match results to a TiDB (MySQL-compatible) database.

## Tech Stack

- Node.js + Express + TypeScript
- pnpm
- [`mysql2`](https://www.npmjs.com/package/mysql2) — TiDB/MySQL client
- [`@descope/node-sdk`](https://www.npmjs.com/package/@descope/node-sdk) — validates session JWTs issued by the frontend's Descope sign-in flow
- Deployed on [Render](https://render.com/)

## Prerequisites

- Node.js 18+
- pnpm
- A TiDB Cloud (or other MySQL-compatible) database
- The same Descope Project ID used by the frontend

## Setup

```bash
pnpm install
```

Create a `.env` file in this directory:

```bash
DATABASE_URL=mysql://user:password@host:port/database?ssl={"rejectUnauthorized":true}
DESCOPE_PROJECT_ID=your_descope_project_id
PORT=5000
```

- `DATABASE_URL` — full MySQL connection string for your TiDB database, including the database name.
- `DESCOPE_PROJECT_ID` — must match the frontend's `VITE_DESCOPE_PROJECT_ID` exactly (same environment: Test or Production).
- `PORT` — port the server listens on (Render sets this automatically in production).

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  result VARCHAR(10) NOT NULL,
  time_seconds INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

`users.id` is the Descope user ID (JWT `sub` claim). A row is automatically inserted/updated in `users` whenever a score is saved, so no separate signup-sync step is needed.

## Running locally

```bash
pnpm dev
```

## Building

```bash
pnpm build
pnpm start
```

`build` compiles TypeScript to `dist/`; `start` runs the compiled output — this is also what Render runs in production.

## API Endpoints

| Method | Path | Auth required | Description |
|---|---|---|---|
| GET | `/api/health` | No | Health check |
| POST | `/api/scores` | Yes | Saves a game result (`{ result: "win" \| "loss" \| "draw", timeSeconds: number }`) for the authenticated user |
| GET | `/api/scores/user/:userId` | No | Returns a user's total games, best time, and average time |
| GET | `/api/leaderboard` | No | Returns the top 10 users by best time |

Authenticated requests must include `Authorization: Bearer <sessionJwt>`, where `sessionJwt` is the token issued by Descope on sign-in.

## Project Structure

```
src/
├── db.ts                    # mysql2 connection pool (TiDB)
├── middleware/
│   └── auth.ts                # Validates the Descope session JWT via @descope/node-sdk
├── routes/
│   └── scores.ts               # /scores, /scores/user/:userId, /leaderboard
└── index.ts                     # Express app entry point
```

## Notes

- `verifyToken` middleware uses `descopeClient.validateSession()`, which validates the JWT locally against Descope's JWKS rather than making a network call per request.
- The `Authorization` header must be a session JWT from a signed-in user, not a Project ID or API key.
