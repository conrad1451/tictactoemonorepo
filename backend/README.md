# Tic Tac Toe - Backend

Express + TypeScript API for the Tic Tac Toe game. Verifies Descope session tokens and persists match results to a MongoDB Atlas database via Mongoose. Serverless-ready for Netlify Functions.

## Tech Stack

- Node.js + Express + TypeScript
- pnpm
- [`mongoose`](https://www.npmjs.com/package/mongoose) — MongoDB object modeling tool
- [`serverless-http`](https://www.npmjs.com/package/serverless-http) — Wraps Express for Netlify Functions execution
- [`@descope/node-sdk`](https://www.npmjs.com/package/@descope/node-sdk) — Validates session JWTs issued by the frontend's Descope sign-in flow
- Deployed on [Netlify Functions](https://www.netlify.com/products/functions/)

## Prerequisites

- Node.js 18+
- pnpm
- A MongoDB Atlas Cluster (or local MongoDB instance)
- The same Descope Project ID used by the frontend

## Setup

```bash
pnpm install
