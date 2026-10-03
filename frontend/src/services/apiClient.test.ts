import { describe, it, expect, vi } from "vitest";
import { ApiError, createApiClient } from "./apiClient";

// CHQ: Claude AI (Sonnet) generated file

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });

const setup = (opts: { token?: string | null; baseUrl?: string; response?: Response } = {}) => {
  let token = opts.token ?? null;
  const fetchFn = vi.fn(async () => opts.response ?? jsonResponse({ ok: true }));
  const client = createApiClient({
    baseUrl: opts.baseUrl ?? "http://api.test/api",
    getToken: () => token,
    fetchFn: fetchFn as unknown as typeof fetch,
  });
  const call = () => fetchFn.mock.calls[0] as unknown as [string, RequestInit];
  return { client, fetchFn, call, setToken: (t: string | null) => (token = t) };
};

describe("URL building", () => {
  it("joins base URL and path without doubling /api", async () => {
    const { client, call } = setup();
    await client.saveScore("win", 12, 4);
    expect(call()[0]).toBe("http://api.test/api/scores");
  });

  it("strips trailing slashes from the base URL", async () => {
    const { client, call } = setup({ baseUrl: "http://api.test/api//" });
    await client.getLeaderboard(5);
    expect(call()[0]).toBe("http://api.test/api/leaderboard?boardSize=5");
  });

  it("defaults boardSize to 3", async () => {
    const { client, call } = setup();
    await client.getLeaderboard();
    expect(call()[0]).toContain("boardSize=3");
  });

  it("encodes user ids in the path", async () => {
    const { client, call } = setup();
    await client.getUserStats("a/b c");
    expect(call()[0]).toBe("http://api.test/api/scores/user/a%2Fb%20c");
  });

  it("routes verifyAuth to /auth/verify", async () => {
    const { client, call } = setup();
    await client.verifyAuth("jwt");
    expect(call()[0]).toBe("http://api.test/api/auth/verify");
  });
});

describe("headers and body", () => {
  it("sends the bearer token when present", async () => {
    const { client, call } = setup({ token: "abc" });
    await client.getLeaderboard(3);
    expect(new Headers(call()[1].headers).get("Authorization")).toBe("Bearer abc");
  });

  it("omits Authorization when there is no token", async () => {
    const { client, call } = setup({ token: null });
    await client.getLeaderboard(3);
    expect(new Headers(call()[1].headers).has("Authorization")).toBe(false);
  });

  it("reads the token on every request", async () => {
    const { client, fetchFn, setToken } = setup({ token: "one" });
    await client.getLeaderboard(3);
    setToken("two");
    await client.getLeaderboard(3);
    const auth = (i: number) =>
      new Headers((fetchFn.mock.calls[i] as unknown as [string, RequestInit])[1].headers).get("Authorization");
    expect([auth(0), auth(1)]).toEqual(["Bearer one", "Bearer two"]);
  });

  it("POSTs a JSON body with Content-Type", async () => {
    const { client, call } = setup();
    await client.saveScore("loss", 30, 5);
    const [, init] = call();
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
    expect(JSON.parse(init.body as string)).toEqual({ result: "loss", timeSeconds: 30, boardSize: 5 });
  });

  it("does not set Content-Type on GET requests", async () => {
    const { client, call } = setup();
    await client.getLeaderboard(3);
    expect(new Headers(call()[1].headers).has("Content-Type")).toBe(false);
  });
});

describe("responses", () => {
  it("returns parsed JSON", async () => {
    const entries = [{ userId: "1", username: "a", bestTime: 3, totalGames: 2 }];
    const { client } = setup({ response: jsonResponse(entries) });
    await expect(client.getLeaderboard(3)).resolves.toEqual(entries);
  });

  it("throws ApiError with status on non-OK responses", async () => {
    const { client } = setup({
      response: new Response("nope", { status: 401, statusText: "Unauthorized" }),
    });
    const err = (await client.saveScore("win", 1, 3).catch((e) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(401);
  });

  it("returns undefined for 204 responses", async () => {
    const { client } = setup({ response: new Response(null, { status: 204 }) });
    await expect(client.saveScore("win", 1, 3)).resolves.toBeUndefined();
  });
});
