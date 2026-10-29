// backend/src/cors.ts

// CHQ: Claude AI (Sonnet) generated file
// Chat GPT (Luna) modified frontend urls into comma separated list

const exactOrigins = (): string[] => [
  ...(process.env.FRONTEND_URLS ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean),
  ...[5173, 5174, 5175, 5176, 5177, 5178].map(
    (port) => `http://localhost:${port}`
  ),
];

// const patterns: RegExp[] = [/^https:\/\/[a-z0-9-]+\.app\.github\.dev$/];

export const isOriginAllowed = (origin: string | undefined): boolean =>
  !origin || exactOrigins().includes(origin.replace(/\/+$/, ""));
// exactOrigins().includes(origin.replace(/\/+$/, "")) ||
// patterns.some((pattern) => pattern.test(origin));
