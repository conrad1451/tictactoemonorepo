// backend/src/cors.ts

// CHQ: Claude AI (Sonnet) generated file

const exactOrigins = (): string[] =>
  [
    process.env.FRONTEND_URL?.replace(/\/$/, ''),
    process.env.FRONTEND_URL_2?.replace(/\/$/, ''),
    ...[5173, 5174, 5175, 5176, 5177, 5178].map((p) => `http://localhost:${p}`),
  ].filter((o): o is string => Boolean(o));

const patterns: RegExp[] = [/^https:\/\/[a-z0-9-]+\.app\.github\.dev$/];

export const isOriginAllowed = (origin: string | undefined): boolean =>
  !origin || exactOrigins().includes(origin) || patterns.some((re) => re.test(origin));
