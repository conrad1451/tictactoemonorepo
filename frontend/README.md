# Tic Tac Toe — Frontend

React + TypeScript + Vite frontend for a Tic Tac Toe game where signed-in players can save their winning times and appear on a leaderboard. Authentication is handled by [Descope](https://www.descope.com/).

## Tech Stack

- React 18 + TypeScript
- Vite
- pnpm
- [`@descope/react-sdk`](https://www.npmjs.com/package/@descope/react-sdk) for authentication

## Prerequisites

- Node.js 18+
- pnpm
- A Descope project (Project ID) with a sign-up/sign-in flow deployed

## Setup

```bash
pnpm install
```

Create a `.env` file in this directory:

```bash
VITE_DESCOPE_PROJECT_ID=your_descope_project_id
VITE_API_URL=http://localhost:5000/api
```

- `VITE_DESCOPE_PROJECT_ID` — Project ID from your Descope project (Project Settings → General). Must match the environment (Test/Production) your sign-in flow is deployed to.
- `VITE_API_URL` — base URL of the backend API. Defaults to `http://localhost:5000/api` if unset.

## Running locally

```bash
pnpm dev
```

Starts the Vite dev server (default `http://localhost:5173`).

## Building

```bash
pnpm build
```

## Project Structure

```
src/
├── components/
│   ├── AuthModal.tsx     # Descope sign-in flow, rendered in a modal
│   ├── GameBoard.tsx      # Tic-tac-toe board UI
│   └── GameStatus.tsx     # Turn/winner/timer display
├── hooks/
│   └── useGameLogic.ts    # Game state, win detection, computer moves
├── services/
│   ├── api.ts              # Backend API client (scores, leaderboard, auth verify)
│   └── auth.ts             # Local persistence of the signed-in user
├── types.ts                 # Shared TypeScript types
├── App.tsx                   # Top-level app, wires auth state to the game
└── main.tsx                   # Entry point; wraps <App /> in Descope's <AuthProvider>
```

## Authentication Flow

1. `main.tsx` wraps the app in `<AuthProvider projectId={VITE_DESCOPE_PROJECT_ID}>`.
2. Clicking "Sign In" opens `AuthModal`, which renders Descope's `<Descope flowId="sign-up-or-in" />` component.
3. On success, the returned user info and session JWT are stored via `services/auth.ts` (localStorage) and attached to future API requests via `setAuthToken` in `services/api.ts`.
4. When a game ends while signed in, the result and elapsed time are POSTed to the backend's `/scores` endpoint automatically.

## Notes

- The Descope flow ID (`sign-up-or-in`) must exist and be deployed in the Descope project matching `VITE_DESCOPE_PROJECT_ID`. Flow IDs are project- and environment-specific — Test and Production projects have separate IDs and separate flows.